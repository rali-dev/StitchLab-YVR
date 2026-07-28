import { Query } from '@nestjs/cqrs';
import type { UserDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Frage: "wer bin ich?" - versorgt `GET /api/auth/me`.
 *
 * Das Frontend könnte die Rolle auch aus dem Token lesen, wenn es an das Token
 * käme - kommt es aber nicht (httpOnly). Genau dafür gibt es diese Route: Sie
 * ist die einzige Stelle, an der die Anwendung erfährt, wer angemeldet ist.
 */
export class GetCurrentUserQuery extends Query<UserDto> {
  constructor(public readonly userId: string) {
    super();
  }
}
