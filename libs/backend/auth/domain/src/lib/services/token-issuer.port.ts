import type { Role } from '@stitchlab-yvr/shared-contracts';

export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

/**
 * Inhalt eines Tokens.
 *
 * `sub` (subject) und `email` folgen der JWT-Konvention. Die Rolle wandert
 * bewusst mit ins Token: Sonst müsste jede geschützte Anfrage den Nutzer aus der
 * Datenbank laden, nur um zu erfahren, ob er Admin ist.
 *
 * Der Preis dieser Abkürzung: Wird einem Nutzer die Admin-Rolle entzogen, gilt
 * sein bereits ausgegebener Access-Token noch bis zu 15 Minuten weiter. Das ist
 * der Grund für die kurze Laufzeit - siehe ADR-0007.
 */
export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Port für die Token-Ausgabe. Die Anwendungsschicht bestellt hier "ein Paar
 * Tokens für diesen Nutzer" und weiß nicht, dass es JWTs sind - dass sie
 * signiert und nicht in einer Tabelle nachgeschlagen werden, ist eine
 * Infrastruktur-Entscheidung.
 *
 * Das Prüfen der Tokens steht bewusst NICHT hier: Das übernehmen die
 * Passport-Strategien an der HTTP-Grenze, bevor ein Handler überhaupt läuft.
 */
export interface ITokenIssuer {
  issueTokens(payload: TokenPayload): Promise<TokenPair>;
}
