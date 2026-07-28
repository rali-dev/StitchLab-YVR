import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@stitchlab-yvr/shared-contracts';
import type { CookieOptions, Response } from 'express';

/** Muss zu den Token-Laufzeiten in der Infrastruktur passen (15 Min / 7 Tage). */
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Der Refresh-Cookie wird NUR an Pfade unterhalb von `/api/auth` geschickt.
 *
 * Das begrenzt seine Angriffsfläche erheblich: Bei jedem normalen API-Aufruf
 * bleibt er im Browser. Nur `refresh` und `logout` sehen ihn überhaupt.
 */
const REFRESH_COOKIE_PATH = '/api/auth';

/**
 * Setzt und löscht die Auth-Cookies.
 *
 * Eigener Baustein, weil hier jedes einzelne Attribut sicherheitsrelevant ist
 * und die Optionen beim **Löschen** exakt denen beim Setzen entsprechen müssen -
 * `clearCookie` mit abweichendem `path` oder `sameSite` löscht schlicht nichts,
 * und der Nutzer bleibt angemeldet, obwohl er auf "Abmelden" geklickt hat.
 * An einer Stelle beschrieben, kann das nicht auseinanderlaufen.
 */
@Injectable()
export class AuthCookieService {
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    // `Secure` verlangt HTTPS. Lokal läuft der Server auf http://localhost -
    // dort würde der Browser das Cookie sonst verwerfen. Deshalb hängt das
    // Attribut an der Umgebung und ist überall sonst an.
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
  }

  setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...this.baseOptions(),
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...this.baseOptions(),
      path: REFRESH_COOKIE_PATH,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  }

  clearAuthCookies(res: Response): void {
    // Ohne `maxAge`, aber mit denselben übrigen Attributen - sonst trifft der
    // Browser das gesetzte Cookie nicht.
    res.clearCookie(ACCESS_TOKEN_COOKIE, { ...this.baseOptions(), path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      ...this.baseOptions(),
      path: REFRESH_COOKIE_PATH,
    });
  }

  private baseOptions(): CookieOptions {
    return {
      // Kein Zugriff aus JavaScript - der eigentliche Schutz gegen Token-Diebstahl
      // per XSS (ADR-0007).
      httpOnly: true,
      // Wird bei fremd-initiierten Anfragen gar nicht erst mitgeschickt und
      // erledigt damit CSRF für diesen Aufbau.
      sameSite: 'strict',
      secure: this.isProduction,
      // BEWUSST kein `domain`: Ohne dieses Attribut bleibt das Cookie
      // host-only und gilt nicht für Subdomains. Ein `domain=.example.com`
      // würde es an jede Subdomain schicken - auch an eine fremd betriebene.
    };
  }
}
