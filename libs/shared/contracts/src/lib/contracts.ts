/**
 * Basis-Fehler der Domaenenschicht: signalisiert eine verletzte Geschaeftsregel
 * oder Invariante (z. B. leerer Slug, ungueltiger Zustand).
 *
 * Bewusst framework-frei (kein NestJS, kein HTTP) - `shared-contracts` ist
 * `platform:universal` und wird von Frontend UND Backend importiert. Die
 * Adapter-Schicht mappt diesen Fehler spaeter per ExceptionFilter auf HTTP
 * 400/409, ohne dass die Domaene HTTP kennen muss.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    // Name explizit setzen: sonst zeigt der Stack nur "Error" statt der Klasse.
    this.name = 'DomainException';
  }
}
