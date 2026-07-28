import { Injectable } from '@nestjs/common';
import type { IPasswordHasher } from '@stitchlab-yvr/backend-auth-domain';
import { compare, hash } from 'bcrypt';

/**
 * Kostenfaktor: 2^12 Durchläufe.
 *
 * Dass das Hashen "langsam" ist, ist keine Schwäche, sondern der Zweck - es
 * begrenzt, wie viele Passwörter ein Angreifer pro Sekunde durchprobieren kann,
 * falls die Datenbank je abfließt. 12 ist der übliche Kompromiss: rund 100 ms
 * pro Hash auf gängiger Hardware, für einen Login unmerklich, für einen Angriff
 * spürbar.
 */
const SALT_ROUNDS = 12;

/**
 * bcrypt-Implementierung des Hash-Ports.
 *
 * Der Salt steckt bei bcrypt bereits im Hash-String - er muss weder separat
 * gespeichert noch übergeben werden. Deshalb genügt `compare(plain, hash)`.
 */
@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, SALT_ROUNDS);
  }

  /**
   * Vergleicht zeitkonstant - `compare` bricht nicht beim ersten
   * abweichenden Zeichen ab. Ein `===` auf Hashes wäre nicht nur falsch
   * (jeder Hash hat einen eigenen Salt), sondern verriete über die Laufzeit
   * auch, wie weit die Übereinstimmung reichte.
   */
  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
