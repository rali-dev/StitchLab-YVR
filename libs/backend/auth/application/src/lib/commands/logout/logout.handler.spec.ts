import {
  UserEntity,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import { LogoutCommand } from './logout.command.js';
import { LogoutHandler } from './logout.handler.js';

describe('LogoutHandler', () => {
  let users: jest.Mocked<IUserRepository>;
  let handler: LogoutHandler;

  beforeEach(() => {
    users = { findById: jest.fn(), findByEmail: jest.fn(), save: jest.fn() };
    handler = new LogoutHandler(users);
    users.save.mockImplementation(async (u) => u);
  });

  it('clears the stored refresh token hash', async () => {
    users.findById.mockResolvedValue(
      UserEntity.register({
        email: 'anna@example.com',
        hashedPassword: '$2b$12$x',
      }).withRefreshToken('$2b$12$storedrefresh'),
    );

    await handler.execute(new LogoutCommand('user-id'));

    expect(users.save.mock.calls[0][0].hashedRefreshToken).toBeNull();
  });

  // Abmelden soll nie fehlschlagen: Wer schon abgemeldet ist, hat sein Ziel
  // erreicht. Ein Fehler wäre hier nur lästig.
  it('is idempotent when there is no active session', async () => {
    users.findById.mockResolvedValue(
      UserEntity.register({
        email: 'anna@example.com',
        hashedPassword: '$2b$12$x',
      }),
    );

    await expect(
      handler.execute(new LogoutCommand('user-id')),
    ).resolves.toBeUndefined();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('does not fail for an unknown user', async () => {
    users.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new LogoutCommand('missing-id')),
    ).resolves.toBeUndefined();
    expect(users.save).not.toHaveBeenCalled();
  });
});
