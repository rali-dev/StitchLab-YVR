import { DomainException } from '@stitchlab-yvr/shared-contracts';
import { Slug } from './slug.value-object.js';

describe('Slug', () => {
  it('accepts lowercase words separated by single hyphens', () => {
    expect(Slug.create('embroidered-tote-bag').toString()).toBe(
      'embroidered-tote-bag',
    );
  });

  it('accepts digits', () => {
    expect(Slug.create('hoodie-2024').toString()).toBe('hoodie-2024');
  });

  it('trims surrounding whitespace instead of rejecting it', () => {
    expect(Slug.create('  linen-scarf  ').toString()).toBe('linen-scarf');
  });

  // Jede dieser Eingaben wuerde eine kaputte oder mehrdeutige URL erzeugen.
  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['uppercase', 'Tote-Bag'],
    ['spaces', 'tote bag'],
    ['leading hyphen', '-tote'],
    ['trailing hyphen', 'tote-'],
    ['double hyphen', 'tote--bag'],
    ['umlaut', 'gruen-tasche-ä'],
    ['slash', 'tote/bag'],
  ])('rejects %s', (_case, value) => {
    expect(() => Slug.create(value)).toThrow(DomainException);
  });

  it('rejects values longer than 80 characters', () => {
    expect(() => Slug.create('a'.repeat(81))).toThrow(DomainException);
  });

  it('compares by value, not by identity', () => {
    expect(Slug.create('linen-scarf').equals(Slug.create('linen-scarf'))).toBe(
      true,
    );
    expect(Slug.create('linen-scarf').equals(Slug.create('wool-scarf'))).toBe(
      false,
    );
  });

  it('serialises to its plain string value', () => {
    expect(JSON.stringify({ slug: Slug.create('linen-scarf') })).toBe(
      '{"slug":"linen-scarf"}',
    );
  });
});
