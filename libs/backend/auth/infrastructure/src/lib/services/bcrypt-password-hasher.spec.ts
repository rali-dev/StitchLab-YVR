import { BcryptPasswordHasher } from './bcrypt-password-hasher.js';

/**
 * Läuft gegen das echte bcrypt - der Sinn dieses Bausteins IST die Bibliothek.
 * Deshalb großzügigere Zeitlimits: Kostenfaktor 12 braucht bewusst ~100 ms.
 */
describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();
  const password = 'correct-horse-battery-staple';

  it('produces a bcrypt hash, never the plain text', async () => {
    const hash = await hasher.hash(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  }, 15000);

  it('accepts the correct password', async () => {
    const hash = await hasher.hash(password);

    await expect(hasher.compare(password, hash)).resolves.toBe(true);
  }, 15000);

  it('rejects a wrong password', async () => {
    const hash = await hasher.hash(password);

    await expect(hasher.compare('wrong-password', hash)).resolves.toBe(false);
  }, 15000);

  // Der Salt steckt im Hash - deshalb ist derselbe Klartext nie zweimal
  // derselbe Hash. Genau das macht Rainbow-Tables wertlos.
  it('produces a different hash every time (salted)', async () => {
    const [first, second] = await Promise.all([
      hasher.hash(password),
      hasher.hash(password),
    ]);

    expect(first).not.toBe(second);
    // Trotzdem passen beide zum selben Passwort.
    await expect(hasher.compare(password, first)).resolves.toBe(true);
    await expect(hasher.compare(password, second)).resolves.toBe(true);
  }, 20000);

  it('returns false instead of throwing on a malformed hash', async () => {
    await expect(hasher.compare(password, 'not-a-hash')).resolves.toBe(false);
  }, 15000);
});
