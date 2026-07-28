import { Injectable } from '@nestjs/common';
import type { ITokenHasher } from '@stitchlab-yvr/backend-auth-domain';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * SHA-256 für Refresh-Tokens.
 *
 * Warum hier KEIN bcrypt (siehe auch `ITokenHasher`):
 *
 * 1. **Längenlimit.** bcrypt schneidet nach 72 Bytes ab. Alle JWTs eines
 *    Nutzers beginnen gleich (Header + Anfang der User-Id), sind also in den
 *    ersten 72 Bytes identisch - mit bcrypt bekämen sie denselben Hash und
 *    jedes alte Token bliebe gültig. Genau dieser Fehler ist im echten Betrieb
 *    aufgefallen, nicht in den Tests.
 * 2. **Langsamkeit bringt nichts.** Der Schutz von bcrypt zielt auf ratbare
 *    Geheimnisse. Ein signiertes JWT ist nicht ratbar; hier zählt nur, dass aus
 *    dem gespeicherten Wert nicht auf das Token zurückgerechnet werden kann.
 *
 * Kein Salt: Der Zweck ist der Abgleich eines konkreten Tokens, nicht der
 * Schutz vor Rainbow-Tables - die es für 250-stellige Zufallswerte nicht gibt.
 * Ohne Salt bleibt der Vergleich ein einfacher Hash-Abgleich.
 */
@Injectable()
export class Sha256TokenHasher implements ITokenHasher {
  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  /**
   * `timingSafeEqual` statt `===`: Ein normaler String-Vergleich bricht beim
   * ersten abweichenden Zeichen ab und verrät über die Laufzeit, wie weit die
   * Übereinstimmung reichte.
   */
  compare(token: string, hash: string): boolean {
    const expected = Buffer.from(this.hash(token), 'hex');
    let actual: Buffer;

    try {
      actual = Buffer.from(hash, 'hex');
    } catch {
      return false;
    }

    // `timingSafeEqual` wirft bei ungleicher Länge - das wäre ein beschädigter
    // oder fremdformatiger Wert in der Datenbank, also schlicht "passt nicht".
    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  }
}
