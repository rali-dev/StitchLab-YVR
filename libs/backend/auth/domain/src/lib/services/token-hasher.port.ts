export const TOKEN_HASHER = Symbol('TOKEN_HASHER');

/**
 * Port für das Hashen von **Tokens** - bewusst getrennt von `IPasswordHasher`.
 *
 * Die Trennung ist keine Kosmetik, sondern folgt aus zwei verschiedenen
 * Anforderungen:
 *
 * - **Passwörter** haben wenig Entropie (Menschen wählen sie). Ihr Hash muss
 *   deshalb absichtlich *langsam* sein, damit Brute-Force teuer bleibt → bcrypt.
 * - **Refresh-Tokens** sind lange Zufallswerte mit sehr hoher Entropie.
 *   Durchprobieren ist chancenlos, Langsamkeit bringt hier nichts - sie kostet
 *   nur Zeit bei jedem Refresh.
 *
 * Und ein handfester Grund kommt dazu: **bcrypt verarbeitet nur die ersten
 * 72 Bytes.** Ein JWT ist ~250 Zeichen lang und beginnt bei jedem Token
 * desselben Nutzers mit denselben Zeichen (Header + Anfang der User-Id).
 * Mit bcrypt hashen deshalb ALLE Refresh-Tokens eines Nutzers auf denselben
 * Wert - und die Rotation wäre wirkungslos, ohne dass irgendetwas fehlschlägt.
 */
export interface ITokenHasher {
  /** Einwegfunktion ohne Längenbegrenzung (SHA-256). */
  hash(token: string): string;

  /** Zeitkonstanter Vergleich. Gibt `false` zurück statt zu werfen. */
  compare(token: string, hash: string): boolean;
}
