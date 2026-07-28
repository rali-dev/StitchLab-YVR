import { UserEntity } from '@stitchlab-yvr/backend-auth-domain';
import type { UserDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Entity → Antwort-Vertrag.
 *
 * Hier entscheidet sich, was den Server verlässt: `hashedPassword` und
 * `hashedRefreshToken` werden **nicht** übernommen. Ein Spread (`...user`) wäre
 * an dieser Stelle ein Sicherheitsfehler - deshalb ist jedes Feld einzeln
 * aufgeführt. Ein neues sensibles Feld in der Entity landet so niemals
 * versehentlich in einer Antwort.
 */
export function toUserDto(user: UserEntity): UserDto {
  return {
    id: user.id,
    email: user.email.toString(),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
