import { Inject, Injectable } from '@nestjs/common';
import {
  TOKEN_HASHER,
  TOKEN_ISSUER,
  USER_REPOSITORY,
  UserEntity,
  type ITokenHasher,
  type ITokenIssuer,
  type IUserRepository,
} from '@stitchlab-yvr/backend-auth-domain';
import type { UserDto } from '@stitchlab-yvr/shared-contracts';
import { toUserDto } from '../mappers/user.mapper.js';

export interface SessionResult {
  user: UserDto;
  tokens: { accessToken: string; refreshToken: string };
}

/**
 * "Eine Sitzung beginnen" - der Ablauf, den sich Login und Refresh teilen.
 *
 * Bewusst ein eigener Baustein und nicht zweimal derselbe Code: Die
 * **Rotation** (neues Refresh-Token ausgeben und seinen Hash am Nutzer
 * hinterlegen) ist der sicherheitskritische Teil. Stünde er an zwei Stellen,
 * wäre die nächste Änderung die, die eine davon vergisst.
 */
@Injectable()
export class SessionService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    // TOKEN_HASHER, nicht PASSWORD_HASHER: bcrypt würde das Token nach 72 Bytes
    // abschneiden - und da alle JWTs eines Nutzers gleich beginnen, bekämen sie
    // denselben Hash. Die Rotation wäre wirkungslos (siehe `ITokenHasher`).
    @Inject(TOKEN_HASHER) private readonly tokenHasher: ITokenHasher,
    @Inject(TOKEN_ISSUER) private readonly tokens: ITokenIssuer,
  ) {}

  async start(user: UserEntity): Promise<SessionResult> {
    const tokens = await this.tokens.issueTokens({
      sub: user.id,
      email: user.email.toString(),
      role: user.role,
    });

    // Gespeichert wird der HASH des Refresh-Tokens - wer die Datenbank liest,
    // kann damit keine Sitzung übernehmen. Und weil hier immer ein frisches
    // Token entsteht, wird das vorherige im selben Schritt entwertet.
    const saved = await this.users.save(
      user.withRefreshToken(this.tokenHasher.hash(tokens.refreshToken)),
    );

    return { user: toUserDto(saved), tokens };
  }
}
