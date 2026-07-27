import {
  DomainException,
  PRODUCT_SLUG_MAX_LENGTH,
  PRODUCT_SLUG_PATTERN,
} from '@stitchlab-yvr/shared-contracts';

/**
 * Der URL-Bezeichner eines Produkts (`/products/embroidered-tote-bag`).
 *
 * Als eigener Typ statt `string`, damit "ist das ein geprueftes Slug oder
 * irgendein String?" vom Compiler beantwortet wird und die Pruefung nur an
 * EINER Stelle steht. Ein `Slug` kann nach der Konstruktion nicht mehr ungueltig
 * sein - es gibt keinen Setter.
 */
export class Slug {
  private constructor(private readonly value: string) {}

  static create(raw: string): Slug {
    // Der Trim ist Absicht: fuehrende Leerzeichen aus Copy-Paste sollen nicht
    // zu einer Fehlermeldung fuehren, die der Nutzer nicht sehen kann.
    const normalized = raw?.trim() ?? '';

    if (normalized.length === 0) {
      throw new DomainException('slug must not be empty.');
    }
    if (normalized.length > PRODUCT_SLUG_MAX_LENGTH) {
      throw new DomainException(
        `slug must not exceed ${PRODUCT_SLUG_MAX_LENGTH} characters.`,
      );
    }
    if (!PRODUCT_SLUG_PATTERN.test(normalized)) {
      throw new DomainException(
        'slug must contain only lowercase letters, digits and single hyphens.',
      );
    }

    return new Slug(normalized);
  }

  toString(): string {
    return this.value;
  }

  /** Sorgt dafuer, dass `JSON.stringify` den Wert und nicht `{}` liefert. */
  toJSON(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}
