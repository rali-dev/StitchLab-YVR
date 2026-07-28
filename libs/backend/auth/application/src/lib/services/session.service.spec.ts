import {
  UserEntity,
  type ITokenHasher,
  type ITokenIssuer,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import { Role } from '@stitchlab-yvr/shared-contracts';
import { SessionService } from './session.service.js';

describe('SessionService', () => {
  let users: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<ITokenHasher>;
  let tokens: jest.Mocked<ITokenIssuer>;
  let service: SessionService;
  let user: UserEntity;

  beforeEach(() => {
    users = { findById: jest.fn(), findByEmail: jest.fn(), save: jest.fn() };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    tokens = { issueTokens: jest.fn() };
    service = new SessionService(users, hasher, tokens);

    user = UserEntity.register({
      email: 'anna@example.com',
      hashedPassword: '$2b$12$storedhash',
    });

    tokens.issueTokens.mockResolvedValue({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
    });
    // `ITokenHasher.hash` ist synchron - SHA-256 braucht kein await.
    hasher.hash.mockReturnValue('a'.repeat(64));
    users.save.mockImplementation(async (u) => u);
  });

  it('puts identity, email and role into the token payload', async () => {
    await service.start(user);

    expect(tokens.issueTokens).toHaveBeenCalledWith({
      sub: user.id,
      email: 'anna@example.com',
      role: Role.USER,
    });
  });

  it('returns both tokens to the caller', async () => {
    const result = await service.start(user);

    expect(result.tokens).toEqual({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
    });
  });

  // Sicherheitskern: In die Datenbank gehört der HASH, niemals das Token selbst.
  // Wer die Datenbank liest, darf damit keine Sitzung übernehmen können.
  it('stores the HASH of the refresh token, never the token itself', async () => {
    await service.start(user);

    expect(hasher.hash).toHaveBeenCalledWith('refresh.jwt');

    const saved = users.save.mock.calls[0][0];
    expect(saved.hashedRefreshToken).toBe('a'.repeat(64));
    expect(saved.hashedRefreshToken).not.toBe('refresh.jwt');
  });

  // Die Rotation an sich: Jeder Aufruf hinterlegt einen neuen Hash und entwertet
  // damit das vorherige Token.
  it('replaces the previously stored hash', async () => {
    const withOldSession = user.withRefreshToken('b'.repeat(64));

    await service.start(withOldSession);

    expect(users.save.mock.calls[0][0].hashedRefreshToken).toBe('a'.repeat(64));
  });

  it('returns a user DTO without any secrets', async () => {
    const result = await service.start(user);

    expect(result.user).toEqual({
      id: user.id,
      email: 'anna@example.com',
      role: Role.USER,
      createdAt: user.createdAt.toISOString(),
    });
    expect(JSON.stringify(result.user)).not.toContain('a'.repeat(64));
    expect(JSON.stringify(result.user)).not.toContain('refresh.jwt');
  });
});
