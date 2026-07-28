import { Sha256TokenHasher } from './sha256-token-hasher.js';

/**
 * Zwei ECHTE Refresh-Tokens desselben Nutzers aus einem Testlauf.
 *
 * Sie unterscheiden sich in Rolle, Zeitstempel und Signatur - aber ihre ersten
 * 72 Bytes sind identisch, weil dort nur der JWT-Header und der Anfang der
 * User-Id stehen. Genau daran ist die Rotation mit bcrypt gescheitert.
 */
const TOKEN_A =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MWJlODEzOS03ODlhLTRhMzYtYmM4OC03YjcwNTg1Y2MwZGYiLCJlbWFpbCI6InZlcmlmeS5hbm5hQGV4YW1wbGUuY29tIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3ODUyNTk3NDYsImV4cCI6MTc4NTg2NDU0Nn0.YjBY0xX6GI8D6FxxoORDyKLfnja-5jQi-sJcRP3ytuM';
const TOKEN_B =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MWJlODEzOS03ODlhLTRhMzYtYmM4OC03YjcwNTg1Y2MwZGYiLCJlbWFpbCI6InZlcmlmeS5hbm5hQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzg1MjYwMDAwLCJleHAiOjE3ODU4NjQ4MDB9.TOTALLY-DIFFERENT-SIGNATURE-abcdefghijk';

describe('Sha256TokenHasher', () => {
  const hasher = new Sha256TokenHasher();

  it('produces a hex digest, never the token itself', () => {
    const hash = hasher.hash(TOKEN_A);

    expect(hash).not.toBe(TOKEN_A);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('accepts the matching token', () => {
    expect(hasher.compare(TOKEN_A, hasher.hash(TOKEN_A))).toBe(true);
  });

  /**
   * DER Regressionstest dieser Datei.
   *
   * Mit bcrypt lieferte genau dieser Fall `true` - alle Refresh-Tokens eines
   * Nutzers galten als derselbe Wert, die Rotation war wirkungslos und ein
   * abgefangenes altes Token blieb nutzbar. Aufgefallen ist das erst beim
   * echten Durchspielen, nicht in einem Unit-Test.
   */
  it('distinguishes two tokens that share their first 72 bytes', () => {
    expect(TOKEN_A.slice(0, 72)).toBe(TOKEN_B.slice(0, 72));
    expect(TOKEN_A).not.toBe(TOKEN_B);

    expect(hasher.compare(TOKEN_A, hasher.hash(TOKEN_B))).toBe(false);
    expect(hasher.compare(TOKEN_B, hasher.hash(TOKEN_A))).toBe(false);
  });

  it('hashes the FULL token, not a truncated prefix', () => {
    const long = 'x'.repeat(500);

    // Unterschied erst an Position 400 - jenseits jeder Kürzungsgrenze.
    expect(hasher.hash(long)).not.toBe(
      hasher.hash(`${'x'.repeat(400)}y${'x'.repeat(99)}`),
    );
  });

  it('is deterministic (no salt - the comparison is a lookup)', () => {
    expect(hasher.hash(TOKEN_A)).toBe(hasher.hash(TOKEN_A));
  });

  it.each([
    ['a wrong token', 'completely.different.token'],
    ['an empty token', ''],
  ])('rejects %s', (_case, token) => {
    expect(hasher.compare(token, hasher.hash(TOKEN_A))).toBe(false);
  });

  // Darf nicht werfen: In der Datenbank könnte ein Altwert im bcrypt-Format
  // stehen. Der passt dann schlicht nicht.
  it.each([
    ['a bcrypt-format legacy value', '$2b$12$7pKwLIzNnIOgZbIuPaLN0u'],
    ['a truncated hash', 'abcdef'],
    ['a non-hex value', 'zzzz'],
    ['an empty hash', ''],
  ])('returns false for %s instead of throwing', (_case, hash) => {
    expect(() => hasher.compare(TOKEN_A, hash)).not.toThrow();
    expect(hasher.compare(TOKEN_A, hash)).toBe(false);
  });
});
