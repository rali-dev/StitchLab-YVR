import {
  UserEntity,
  type ITokenHasher,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import { AuthenticationException } from '@stitchlab-yvr/shared-contracts';
import { SessionService } from '../../services/session.service.js';
import { RefreshSessionCommand } from './refresh-session.command.js';
import { RefreshSessionHandler } from './refresh-session.handler.js';

describe('RefreshSessionHandler', () => {
  let users: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<ITokenHasher>;
  let session: { start: jest.Mock };
  let handler: RefreshSessionHandler;
  let withSession: UserEntity;

  beforeEach(() => {
    users = { findById: jest.fn(), findByEmail: jest.fn(), save: jest.fn() };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    session = { start: jest.fn().mockResolvedValue({ user: {}, tokens: {} }) };
    handler = new RefreshSessionHandler(
      users,
      hasher,
      session as unknown as SessionService,
    );

    withSession = UserEntity.register({
      email: 'anna@example.com',
      hashedPassword: '$2b$12$storedhash',
    // SHA-256-Hex, kein bcrypt: Refresh-Tokens werden bewusst anders gehasht
    // als Passwoerter (siehe ITokenHasher).
    }).withRefreshToken('c'.repeat(64));

    users.findById.mockResolvedValue(withSession);
    hasher.compare.mockReturnValue(true);
  });

  const command = new RefreshSessionCommand('user-id', 'raw.refresh.token');

  it('issues a new session for a matching token', async () => {
    await handler.execute(command);

    expect(hasher.compare).toHaveBeenCalledWith(
      'raw.refresh.token',
      'c'.repeat(64),
    );
    expect(session.start).toHaveBeenCalledWith(withSession);
  });

  it('rejects an unknown user', async () => {
    users.findById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(
      AuthenticationException,
    );
  });

  // DER entscheidende Test: Nach dem Logout ist das Token zwar noch gültig
  // signiert, aber serverseitig entwertet. Ohne diese Prüfung wäre "Abmelden"
  // wirkungslos, bis das Token von selbst abläuft.
  it('rejects a token after logout, even if it is still validly signed', async () => {
    users.findById.mockResolvedValue(withSession.withoutRefreshToken());

    await expect(handler.execute(command)).rejects.toThrow(
      AuthenticationException,
    );
    // Gar nicht erst verglichen - es gibt nichts zu vergleichen.
    expect(hasher.compare).not.toHaveBeenCalled();
    expect(session.start).not.toHaveBeenCalled();
  });

  // Die Rotation: Ein zuvor benutztes Token passt nicht mehr zum gespeicherten
  // Hash, weil beim letzten Refresh ein neues ausgegeben wurde.
  it('rejects a superseded token', async () => {
    hasher.compare.mockReturnValue(false);

    await expect(handler.execute(command)).rejects.toThrow(
      AuthenticationException,
    );
    expect(session.start).not.toHaveBeenCalled();
  });

  it('does not reveal why the session was rejected', async () => {
    hasher.compare.mockReturnValue(false);

    const error = (await handler.execute(command).catch((e: Error) => e)) as Error;

    expect(error.message).not.toMatch(/hash|token .*mismatch|logout/i);
  });
});
