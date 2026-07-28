import {
  UserEntity,
  type IPasswordHasher,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import {
  DomainException,
  ResourceConflictException,
  Role,
} from '@stitchlab-yvr/shared-contracts';
import { RegisterCommand } from './register.command.js';
import { RegisterHandler } from './register.handler.js';

describe('RegisterHandler', () => {
  let users: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let handler: RegisterHandler;

  beforeEach(() => {
    users = { findById: jest.fn(), findByEmail: jest.fn(), save: jest.fn() };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    handler = new RegisterHandler(users, hasher);

    users.findByEmail.mockResolvedValue(null);
    hasher.hash.mockResolvedValue('$2b$12$hashedpassword');
    users.save.mockImplementation(async (u) => u);
  });

  const command = new RegisterCommand(
    'anna@example.com',
    'correct-horse-battery',
  );

  it('creates the account and returns a DTO', async () => {
    const result = await handler.execute(command);

    expect(result.email).toBe('anna@example.com');
    expect(result.role).toBe(Role.USER);
    expect(users.save).toHaveBeenCalledTimes(1);
  });

  // Das Klartext-Passwort darf die Anwendung nie im Klartext verlassen.
  it('hashes the password and never stores it in plain text', async () => {
    await handler.execute(command);

    expect(hasher.hash).toHaveBeenCalledWith('correct-horse-battery');

    const saved = users.save.mock.calls[0][0];
    expect(saved.hashedPassword).toBe('$2b$12$hashedpassword');
    expect(saved.hashedPassword).not.toBe('correct-horse-battery');
  });

  it('never returns password material to the caller', async () => {
    const result = await handler.execute(command);

    expect(JSON.stringify(result)).not.toContain('$2b$');
    expect(JSON.stringify(result)).not.toContain('correct-horse-battery');
  });

  it('rejects an already registered email', async () => {
    users.findByEmail.mockResolvedValue(
      UserEntity.register({
        email: 'anna@example.com',
        hashedPassword: '$2b$12$x',
      }),
    );

    await expect(handler.execute(command)).rejects.toThrow(
      ResourceConflictException,
    );
    expect(users.save).not.toHaveBeenCalled();
  });

  // Ohne Normalisierung vor der Suche würde `Anna@Example.com` als frei gelten,
  // obwohl `anna@example.com` bereits existiert.
  it('checks availability with the normalised email', async () => {
    await handler.execute(
      new RegisterCommand('Anna@EXAMPLE.com', 'correct-horse-battery'),
    );

    expect(users.findByEmail).toHaveBeenCalledWith('anna@example.com');
  });

  it('rejects an invalid email before touching the repository', async () => {
    await expect(
      handler.execute(new RegisterCommand('not-an-email', 'password12')),
    ).rejects.toThrow(DomainException);
    expect(users.save).not.toHaveBeenCalled();
  });

  // Kein Weg, sich selbst zum Admin zu machen: Der Command trägt gar keine Rolle.
  it('always creates a plain USER, never an ADMIN', async () => {
    const result = await handler.execute(command);

    expect(result.role).toBe(Role.USER);
    expect(users.save.mock.calls[0][0].isAdmin()).toBe(false);
  });
});
