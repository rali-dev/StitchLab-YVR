import {
  UserEntity,
  type IPasswordHasher,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import { AuthenticationException } from '@stitchlab-yvr/shared-contracts';
import { SessionService } from '../../services/session.service.js';
import { LoginCommand } from './login.command.js';
import { LoginHandler } from './login.handler.js';

describe('LoginHandler', () => {
  let users: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let session: { start: jest.Mock };
  let handler: LoginHandler;
  let existing: UserEntity;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    session = { start: jest.fn().mockResolvedValue({ user: {}, tokens: {} }) };
    handler = new LoginHandler(
      users,
      hasher,
      session as unknown as SessionService,
    );

    existing = UserEntity.register({
      email: 'anna@example.com',
      hashedPassword: '$2b$12$storedhash',
    });
    users.findByEmail.mockResolvedValue(existing);
    hasher.compare.mockResolvedValue(true);
  });

  const command = new LoginCommand('anna@example.com', 'correct-horse-battery');

  it('starts a session on correct credentials', async () => {
    await handler.execute(command);

    expect(session.start).toHaveBeenCalledWith(existing);
  });

  it('looks the user up by the normalised email', async () => {
    await handler.execute(new LoginCommand('Anna@EXAMPLE.com', 'pw'));

    expect(users.findByEmail).toHaveBeenCalledWith('anna@example.com');
  });

  it('rejects a wrong password', async () => {
    hasher.compare.mockResolvedValue(false);

    await expect(handler.execute(command)).rejects.toThrow(
      AuthenticationException,
    );
    expect(session.start).not.toHaveBeenCalled();
  });

  it('rejects an unknown email', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(
      AuthenticationException,
    );
  });

  // Der Kern des Enumerationsschutzes: Beide Fehlerfälle müssen für den
  // Aufrufer ununterscheidbar sein - sonst wird der Login zum Verzeichnis
  // registrierter Adressen.
  it('gives the SAME message for unknown email and wrong password', async () => {
    users.findByEmail.mockResolvedValue(null);
    const unknownEmail = await handler.execute(command).catch((e: Error) => e);

    users.findByEmail.mockResolvedValue(existing);
    hasher.compare.mockResolvedValue(false);
    const wrongPassword = await handler.execute(command).catch((e: Error) => e);

    expect((unknownEmail as Error).message).toBe(
      (wrongPassword as Error).message,
    );
    // "invalid email or password" ist genau richtig: Die Meldung nennt beide
    // Möglichkeiten und legt sich auf keine fest. Verboten sind Formulierungen,
    // die verraten, WELCHE der beiden zutraf.
    expect((unknownEmail as Error).message).not.toMatch(
      /no such|not found|unknown (email|user)|does not exist|wrong password/i,
    );
  });

  // Und die zweite Hälfte desselben Schutzes: Ohne diesen Vergleich würde die
  // Antwort bei unbekannter Adresse messbar schneller kommen.
  it('still runs a hash comparison when the email is unknown', async () => {
    users.findByEmail.mockResolvedValue(null);

    await handler.execute(command).catch(() => undefined);

    expect(hasher.compare).toHaveBeenCalledTimes(1);
    // Verglichen wird gegen die Attrappe, nicht gegen einen echten Hash.
    expect(hasher.compare.mock.calls[0][1]).toMatch(/^\$2b\$12\$/);
  });

  it('never leaks the stored hash in the error', async () => {
    hasher.compare.mockResolvedValue(false);

    const error = (await handler.execute(command).catch((e: Error) => e)) as Error;

    expect(error.message).not.toContain('$2b$');
  });
});
