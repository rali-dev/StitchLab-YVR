import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Mindestlänge eines Signaturschlüssels. Kürzer ist gegen Brute-Force zu schwach. */
const MIN_SECRET_LENGTH = 32;

/**
 * Laufzeiten der Tokens.
 *
 * Der Access-Token ist absichtlich kurzlebig: Er trägt die Rolle in sich
 * (siehe `TokenPayload`), lässt sich also nicht widerrufen. 15 Minuten ist die
 * Zeitspanne, in der ein entzogenes Admin-Recht schlimmstenfalls noch gilt.
 */
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL = '7d';

/** Muss zu REFRESH_TOKEN_TTL passen - für die Cookie-Lebensdauer in Millisekunden. */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * Liest und **prüft** die Auth-Geheimnisse beim Start.
 *
 * Die Prüfungen laufen im Konstruktor, und der Provider wird beim Hochfahren
 * des Moduls erzeugt: Stimmt etwas nicht, **bricht der Prozess ab, bevor er
 * einen Port öffnet**. Das ist die Absicht. Ein Server, der mit einem
 * Standard-Secret oder ganz ohne startet, ist gefährlicher als einer, der gar
 * nicht startet - denn er sieht funktionierend aus.
 */
@Injectable()
export class AuthConfig {
  readonly accessSecret: string;
  readonly refreshSecret: string;

  constructor(config: ConfigService) {
    // `getOrThrow` statt `get`: kein stiller `undefined`-Wert, der später zu
    // einem unsignierten oder mit "undefined" signierten Token führt.
    this.accessSecret = config.getOrThrow<string>('JWT_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');

    AuthConfig.assertStrong('JWT_SECRET', this.accessSecret);
    AuthConfig.assertStrong('JWT_REFRESH_SECRET', this.refreshSecret);

    // Der wichtigste Test: Wären beide Schlüssel gleich, könnte ein
    // Refresh-Token als Access-Token durchgehen - die lange Laufzeit des einen
    // würde die kurze des anderen aushebeln und die ganze Trennung wäre
    // wirkungslos.
    if (this.accessSecret === this.refreshSecret) {
      throw new Error(
        'JWT_SECRET and JWT_REFRESH_SECRET must be different values.',
      );
    }
  }

  private static assertStrong(name: string, value: string): void {
    if (value.trim().length < MIN_SECRET_LENGTH) {
      throw new Error(
        `${name} must be at least ${MIN_SECRET_LENGTH} characters long.`,
      );
    }
  }
}
