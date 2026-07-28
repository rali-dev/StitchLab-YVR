import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { TokenPayload } from '@stitchlab-yvr/backend-auth-domain';
import { ACCESS_TOKEN_COOKIE } from '@stitchlab-yvr/shared-contracts';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthConfig } from '../config/auth.config.js';

/**
 * Liest den Access-Token **ausschließlich aus dem Cookie**.
 *
 * Kein `ExtractJwt.fromAuthHeaderAsBearerToken()`: Würde der Header zusätzlich
 * akzeptiert, wäre der ganze Cookie-Ansatz umgehbar - ein per XSS gestohlenes
 * Token könnte einfach im Header nachgereicht werden. Der Cookie ist der einzige
 * anerkannte Weg (ADR-0007).
 */
export const extractAccessTokenFromCookie = (req: Request): string | null =>
  (req?.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined) ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: AuthConfig) {
    super({
      jwtFromRequest: extractAccessTokenFromCookie,
      // Abgelaufene Tokens werden abgelehnt - das ist der Sinn der 15 Minuten.
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    });
  }

  /**
   * Läuft erst, nachdem Passport Signatur und Ablaufzeit geprüft hat. Der
   * Rückgabewert landet als `request.user` in Controllern und Guards.
   *
   * Bewusst **ohne** Datenbankzugriff: Das würde jede geschützte Anfrage eine
   * Abfrage kosten. Der Preis ist, dass eine geänderte Rolle erst mit dem
   * nächsten Access-Token greift - deshalb die kurze Laufzeit.
   */
  validate(payload: TokenPayload): TokenPayload {
    return payload;
  }
}
