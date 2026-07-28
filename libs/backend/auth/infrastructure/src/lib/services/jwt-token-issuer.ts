import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  ITokenIssuer,
  TokenPair,
  TokenPayload,
} from '@stitchlab-yvr/backend-auth-domain';
import {
  ACCESS_TOKEN_TTL,
  AuthConfig,
  REFRESH_TOKEN_TTL,
} from '../config/auth.config.js';

/**
 * Gibt das Token-Paar aus.
 *
 * Beide Tokens werden mit **verschiedenen Schlüsseln** signiert. Das ist der
 * Kern der Trennung: Ein Refresh-Token kann damit nicht als Access-Token
 * durchgehen - die Access-Strategie prüft gegen `JWT_SECRET` und weist eine
 * Signatur aus `JWT_REFRESH_SECRET` ab. Ohne diese Trennung hätte ein
 * abgefangenes Refresh-Token sieben Tage lang vollen Zugriff.
 *
 * Beide werden parallel erzeugt - sie hängen nicht voneinander ab.
 */
@Injectable()
export class JwtTokenIssuer implements ITokenIssuer {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AuthConfig,
  ) {}

  async issueTokens(payload: TokenPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.accessSecret,
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.refreshSecret,
        expiresIn: REFRESH_TOKEN_TTL,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
