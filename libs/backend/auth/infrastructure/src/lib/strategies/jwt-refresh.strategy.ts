import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { TokenPayload } from '@stitchlab-yvr/backend-auth-domain';
import { REFRESH_TOKEN_COOKIE } from '@stitchlab-yvr/shared-contracts';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthConfig } from '../config/auth.config.js';

/** Was der Refresh-Endpunkt in `request.user` vorfindet. */
export interface RefreshTokenPayload extends TokenPayload {
  /** Das rohe Token - der Handler braucht es für den Abgleich mit dem gespeicherten Hash. */
  refreshToken: string;
}

export const extractRefreshTokenFromCookie = (req: Request): string | null =>
  (req?.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined) ?? null;

/**
 * Zweite Strategie, eigener Schlüssel, eigener Cookie.
 *
 * Sie prüft nur die **Signatur**. Ob die Sitzung noch gilt, entscheidet erst der
 * `RefreshSessionHandler` über den Abgleich mit dem in der Datenbank
 * hinterlegten Hash — deshalb reicht die Strategie das rohe Token weiter.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: AuthConfig) {
    super({
      jwtFromRequest: extractRefreshTokenFromCookie,
      ignoreExpiration: false,
      secretOrKey: config.refreshSecret,
      // Nötig, um im `validate` an das rohe Token heranzukommen: Passport
      // übergibt sonst nur den entschlüsselten Inhalt.
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: TokenPayload): RefreshTokenPayload {
    const refreshToken = extractRefreshTokenFromCookie(req);

    // Kann eigentlich nicht eintreten - ohne Cookie wäre Passport gar nicht bis
    // hierher gekommen. Die Prüfung existiert, damit der Typ stimmt und ein
    // künftiger Umbau der Extraktion nicht still ein leeres Token durchreicht.
    if (!refreshToken) {
      throw new UnauthorizedException('refresh token is missing.');
    }

    return { ...payload, refreshToken };
  }
}
