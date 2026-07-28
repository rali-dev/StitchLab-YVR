import { DomainException, Role } from '@stitchlab-yvr/shared-contracts';
import { UserEntity, type UserSnapshot } from './user.entity.js';

const validProps = {
  email: 'anna@example.com',
  hashedPassword: '$2b$12$abcdefghijklmnopqrstuv',
};

describe('UserEntity.register', () => {
  it('creates a user with an id and timestamps', () => {
    const user = UserEntity.register(validProps);

    expect(user.id).toHaveLength(36);
    expect(user.email.toString()).toBe('anna@example.com');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('defaults to the USER role - never ADMIN', () => {
    expect(UserEntity.register(validProps).role).toBe(Role.USER);
    expect(UserEntity.register(validProps).isAdmin()).toBe(false);
  });

  it('starts without an active session', () => {
    const user = UserEntity.register(validProps);

    expect(user.hashedRefreshToken).toBeNull();
    expect(user.hasActiveSession()).toBe(false);
  });

  it('normalises the email through the value object', () => {
    expect(
      UserEntity.register({ ...validProps, email: 'Anna@EXAMPLE.com' }).email.toString(),
    ).toBe('anna@example.com');
  });

  // Absicherung gegen den schlimmsten denkbaren Fehler an dieser Stelle: ein
  // Konto, dessen "Passwort" ein leerer String ist.
  it('refuses an empty password hash', () => {
    expect(() =>
      UserEntity.register({ ...validProps, hashedPassword: '' }),
    ).toThrow(DomainException);
    expect(() =>
      UserEntity.register({ ...validProps, hashedPassword: '   ' }),
    ).toThrow(DomainException);
  });

  it('rejects an invalid email', () => {
    expect(() =>
      UserEntity.register({ ...validProps, email: 'not-an-email' }),
    ).toThrow(DomainException);
  });
});

describe('UserEntity session handling', () => {
  const user = UserEntity.register(validProps);

  it('remembers a refresh token hash', () => {
    const withSession = user.withRefreshToken('$2b$12$hashedrefreshtoken');

    expect(withSession.hashedRefreshToken).toBe('$2b$12$hashedrefreshtoken');
    expect(withSession.hasActiveSession()).toBe(true);
  });

  it('clears the session on logout', () => {
    const loggedOut = user
      .withRefreshToken('$2b$12$hashedrefreshtoken')
      .withoutRefreshToken();

    expect(loggedOut.hashedRefreshToken).toBeNull();
    expect(loggedOut.hasActiveSession()).toBe(false);
  });

  it('keeps identity and password across session changes', () => {
    const withSession = user.withRefreshToken('$2b$12$hash');

    expect(withSession.id).toBe(user.id);
    expect(withSession.hashedPassword).toBe(user.hashedPassword);
    expect(withSession.role).toBe(user.role);
  });

  it('leaves the original untouched (immutable)', () => {
    user.withRefreshToken('$2b$12$hash');

    expect(user.hashedRefreshToken).toBeNull();
  });

  it('refuses an empty refresh token hash', () => {
    expect(() => user.withRefreshToken('')).toThrow(DomainException);
  });
});

describe('UserEntity.restore / toSnapshot', () => {
  const snapshot: UserSnapshot = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@example.com',
    hashedPassword: '$2b$12$storedhash',
    hashedRefreshToken: null,
    role: Role.ADMIN,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-02-01T10:00:00.000Z'),
  };

  it('round-trips without losing information', () => {
    expect(UserEntity.restore(snapshot).toSnapshot()).toEqual(snapshot);
  });

  it('recognises an admin', () => {
    expect(UserEntity.restore(snapshot).isAdmin()).toBe(true);
  });
});
