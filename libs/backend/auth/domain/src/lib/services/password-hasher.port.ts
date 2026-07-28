export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

/**
 * Port für das Hashen und Prüfen von Geheimnissen (Passwörter und
 * Refresh-Tokens).
 *
 * Warum als Port und nicht direkt `bcrypt` im Handler: Das Hash-Verfahren ist
 * eine technische Entscheidung mit begrenzter Haltbarkeit - heute bcrypt,
 * morgen vielleicht argon2. Fachlich ändert das nichts. Hinter diesem Interface
 * ist der Wechsel eine Änderung an genau einer Datei, und die Handler-Tests
 * laufen ohne die (absichtlich langsame) echte Hash-Funktion.
 *
 * `compare` ist bewusst Teil des Ports: Der Vergleich MUSS in derselben
 * Bibliothek passieren wie das Hashen - ein `===` auf Hashes wäre sowohl falsch
 * (Salt) als auch anfällig für Timing-Angriffe.
 */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;

  /** Zeitkonstanter Vergleich. Gibt `false` zurück statt zu werfen. */
  compare(plain: string, hash: string): Promise<boolean>;
}
