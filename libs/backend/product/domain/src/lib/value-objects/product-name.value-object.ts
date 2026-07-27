import {
  DomainException,
  PRODUCT_NAME_MAX_LENGTH,
} from '@stitchlab-yvr/shared-contracts';

/**
 * Der Anzeigename eines Produkts. EN-only (eine Spalte im Datenmodell) - kaeme
 * eine zweite Sprache dazu, waere das der Ort, an dem aus `value` eine Map
 * `locale -> value` wird, ohne dass ein Aufrufer davon etwas merkt.
 */
export class ProductName {
  private constructor(private readonly value: string) {}

  static create(raw: string): ProductName {
    const normalized = raw?.trim() ?? '';

    if (normalized.length === 0) {
      throw new DomainException('name must not be empty.');
    }
    if (normalized.length > PRODUCT_NAME_MAX_LENGTH) {
      throw new DomainException(
        `name must not exceed ${PRODUCT_NAME_MAX_LENGTH} characters.`,
      );
    }

    return new ProductName(normalized);
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  equals(other: ProductName): boolean {
    return this.value === other.value;
  }
}
