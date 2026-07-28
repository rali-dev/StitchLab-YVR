import { Command } from '@nestjs/cqrs';
import type { UserDto } from '@stitchlab-yvr/shared-contracts';

/**
 * Absicht: "lege ein Konto an".
 *
 * Gibt bewusst **keine** Tokens zurück - Registrieren und Anmelden sind zwei
 * Absichten (ADR-0003). Das Frontend ruft nach dem Registrieren den Login auf.
 * Der Vorteil: Wird später eine E-Mail-Bestätigung eingeführt, ändert sich am
 * Login nichts.
 */
export class RegisterCommand extends Command<UserDto> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
