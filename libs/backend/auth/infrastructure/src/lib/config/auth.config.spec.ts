import { ConfigService } from '@nestjs/config';
import { AuthConfig } from './auth.config.js';

/**
 * Diese Tests beschreiben, wann der Server **nicht starten darf**.
 *
 * Ein Backend, das mit einem schwachen oder fehlenden Signaturschlüssel
 * hochfährt, ist gefährlicher als eines, das gar nicht startet - es sieht
 * funktionierend aus, während jeder sich selbst gültige Tokens ausstellen kann.
 */
describe('AuthConfig', () => {
  const strong = 'a'.repeat(48);
  const alsoStrong = 'b'.repeat(48);

  /** Bildet `ConfigService` nach: `getOrThrow` wirft bei fehlendem Wert. */
  const configWith = (values: Record<string, string | undefined>) =>
    ({
      getOrThrow: (key: string) => {
        const value = values[key];
        if (value === undefined) {
          throw new Error(`Configuration key "${key}" does not exist`);
        }
        return value;
      },
    }) as unknown as ConfigService;

  it('accepts two different strong secrets', () => {
    const config = new AuthConfig(
      configWith({ JWT_SECRET: strong, JWT_REFRESH_SECRET: alsoStrong }),
    );

    expect(config.accessSecret).toBe(strong);
    expect(config.refreshSecret).toBe(alsoStrong);
  });

  it('refuses to start when JWT_SECRET is missing', () => {
    expect(
      () => new AuthConfig(configWith({ JWT_REFRESH_SECRET: alsoStrong })),
    ).toThrow();
  });

  it('refuses to start when JWT_REFRESH_SECRET is missing', () => {
    expect(() => new AuthConfig(configWith({ JWT_SECRET: strong }))).toThrow();
  });

  it.each([
    ['empty', ''],
    ['far too short', 'secret'],
    ['just below the limit', 'a'.repeat(31)],
    ['only whitespace padding', `${' '.repeat(40)}short`],
  ])('refuses a %s access secret', (_case, value) => {
    expect(
      () =>
        new AuthConfig(
          configWith({ JWT_SECRET: value, JWT_REFRESH_SECRET: alsoStrong }),
        ),
    ).toThrow(/at least 32 characters/);
  });

  it('refuses a weak refresh secret', () => {
    expect(
      () =>
        new AuthConfig(
          configWith({ JWT_SECRET: strong, JWT_REFRESH_SECRET: 'short' }),
        ),
    ).toThrow(/at least 32 characters/);
  });

  // Der wichtigste Test der Datei: Wären beide Schlüssel gleich, ginge ein
  // Refresh-Token als Access-Token durch - die 7-Tage-Laufzeit würde die
  // 15-Minuten-Grenze aushebeln und die ganze Trennung wäre wirkungslos.
  it('refuses two identical secrets, even if both are strong', () => {
    expect(
      () =>
        new AuthConfig(
          configWith({ JWT_SECRET: strong, JWT_REFRESH_SECRET: strong }),
        ),
    ).toThrow(/must be different/);
  });

  it('accepts exactly 32 characters', () => {
    expect(
      () =>
        new AuthConfig(
          configWith({
            JWT_SECRET: 'a'.repeat(32),
            JWT_REFRESH_SECRET: alsoStrong,
          }),
        ),
    ).not.toThrow();
  });
});
