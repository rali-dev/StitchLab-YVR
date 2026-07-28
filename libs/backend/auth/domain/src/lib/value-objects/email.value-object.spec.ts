import { DomainException } from '@stitchlab-yvr/shared-contracts';
import { Email } from './email.value-object.js';

describe('Email', () => {
  it('accepts a normal address', () => {
    expect(Email.create('anna@example.com').toString()).toBe('anna@example.com');
  });

  // Der eigentliche Zweck dieses Value Objects: Ohne Normalisierung wären das
  // zwei verschiedene Konten für denselben Menschen.
  it('lowercases the address', () => {
    expect(Email.create('Anna@Example.COM').toString()).toBe(
      'anna@example.com',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(Email.create('  anna@example.com  ').toString()).toBe(
      'anna@example.com',
    );
  });

  it('treats differently written addresses as equal', () => {
    expect(
      Email.create('Anna@Example.com').equals(Email.create('anna@example.com')),
    ).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['no at sign', 'anna.example.com'],
    ['no domain', 'anna@'],
    ['no local part', '@example.com'],
    ['no dot in domain', 'anna@example'],
    ['spaces inside', 'an na@example.com'],
    ['two at signs', 'anna@@example.com'],
  ])('rejects %s', (_case, value) => {
    expect(() => Email.create(value)).toThrow(DomainException);
  });

  it('rejects addresses longer than 254 characters', () => {
    expect(() => Email.create(`${'a'.repeat(250)}@example.com`)).toThrow(
      DomainException,
    );
  });
});
