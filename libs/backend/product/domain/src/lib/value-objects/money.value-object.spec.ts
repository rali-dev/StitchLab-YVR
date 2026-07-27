import { DomainException } from '@stitchlab-yvr/shared-contracts';
import { Money } from './money.value-object.js';

describe('Money', () => {
  it('keeps the exact cent amount', () => {
    expect(Money.fromCents(4999).toCents()).toBe(4999);
  });

  it('allows zero (a giveaway is not a bug)', () => {
    expect(Money.fromCents(0).toCents()).toBe(0);
  });

  // Der eigentliche Grund fuer diesen Typ: 49.99 als Dollar-Zahl waere eine
  // Fliesskommazahl und damit nicht exakt summierbar.
  it('rejects fractional cents', () => {
    expect(() => Money.fromCents(49.99)).toThrow(DomainException);
  });

  it('rejects NaN', () => {
    expect(() => Money.fromCents(Number.NaN)).toThrow(DomainException);
  });

  it('rejects negative amounts', () => {
    expect(() => Money.fromCents(-1)).toThrow(DomainException);
  });

  it('rejects amounts above the sanity limit', () => {
    expect(() => Money.fromCents(100_000_001)).toThrow(DomainException);
  });

  it('serialises to a plain number', () => {
    expect(JSON.stringify({ price: Money.fromCents(4999) })).toBe(
      '{"price":4999}',
    );
  });
});
