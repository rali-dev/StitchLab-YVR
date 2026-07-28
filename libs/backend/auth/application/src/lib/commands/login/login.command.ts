import { Command } from '@nestjs/cqrs';
import type { TokenPair } from '@stitchlab-yvr/backend-auth-domain';
import type { UserDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Ergebnis einer erfolgreichen Anmeldung.
 *
 * Die Tokens gehen an den Controller, der sie in HttpOnly-Cookies setzt - sie
 * landen NIE im Antwort-Körper (ADR-0007). Der Körper enthält nur den Nutzer,
 * damit das Frontend weiß, wer angemeldet ist.
 */
export interface LoginResult {
  user: UserDto;
  tokens: TokenPair;
}

export class LoginCommand extends Command<LoginResult> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
