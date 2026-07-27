import {
  DomainException,
  PRODUCT_PRICE_MAX_CENTS,
} from '@stitchlab-yvr/shared-contracts';

/**
 * Ein Geldbetrag - intern IMMER als ganzzahlige Cent.
 *
 * Warum kein `number` in Dollar: Fliesskomma kann 0.1 nicht exakt darstellen,
 * und Preise, die sich beim Summieren um einen Cent verschieben, sind ein
 * echter Bug im Warenkorb. Deshalb Integer-Cent im gesamten Stack (auch in der
 * DB: `priceCents Int`), und Formatierung erst in der Anzeige.
 */
export class Money {
  private constructor(private readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new DomainException('priceCents must be an integer.');
    }
    if (cents < 0) {
      throw new DomainException('priceCents must not be negative.');
    }
    if (cents > PRODUCT_PRICE_MAX_CENTS) {
      throw new DomainException(
        `priceCents must not exceed ${PRODUCT_PRICE_MAX_CENTS}.`,
      );
    }

    return new Money(cents);
  }

  toCents(): number {
    return this.cents;
  }

  toJSON(): number {
    return this.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
