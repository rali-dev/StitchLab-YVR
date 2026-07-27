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

/**
 * Die angefragte Ressource existiert nicht. Eigene Klasse (statt nur einer
 * Meldung), damit der ExceptionFilter der Adapter-Schicht sie auf HTTP 404
 * abbilden kann - die Anwendungsschicht bleibt dabei frei von HTTP-Wissen.
 */
export class ResourceNotFoundException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundException';
  }
}

/**
 * Kollision mit dem bestehenden Zustand (z. B. ein bereits vergebener Slug).
 * Wird vom ExceptionFilter auf HTTP 409 abgebildet.
 */
export class ResourceConflictException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceConflictException';
  }
}
