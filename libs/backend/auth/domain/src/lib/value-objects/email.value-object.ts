import {
  DomainException,
  EMAIL_MAX_LENGTH,
} from '@stitchlab-yvr/shared-contracts';

/**
 * Bewusst nachsichtig: Diese Prüfung stellt sicher, dass die Adresse eine
 * plausible Form hat - nicht, dass sie erreichbar ist. Das kann keine
 * Regel leisten, nur eine Bestätigungsmail.
 *
 * Kein exotisch-vollständiger RFC-5322-Ausdruck: solche Muster sind kaum lesbar,
 * schwer zu prüfen und lehnen erfahrungsgemäß eher gültige Adressen ab, als
 * ungültige zu fangen.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/**
 * Die E-Mail-Adresse ist zugleich der Anmeldename - deshalb ein eigener Typ.
 *
 * Wichtigste Eigenschaft: **Normalisierung auf Kleinschreibung**. Ohne sie wären
 * `Anna@example.com` und `anna@example.com` zwei verschiedene Konten, obwohl der
 * Nutzer dasselbe meint - und der Unique-Index in der Datenbank würde beide
 * zulassen.
 */
export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw?.trim().toLowerCase() ?? '';

    if (normalized.length === 0) {
      throw new DomainException('email must not be empty.');
    }
    if (normalized.length > EMAIL_MAX_LENGTH) {
      throw new DomainException(
        `email must not exceed ${EMAIL_MAX_LENGTH} characters.`,
      );
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new DomainException('email must be a valid email address.');
    }

    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
