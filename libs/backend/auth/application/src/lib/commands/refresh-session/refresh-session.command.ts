import { Command } from '@nestjs/cqrs';
import type { LoginResult } from '../login/login.command.js';

/**
 * Absicht: "gib mir ein frisches Token-Paar".
 *
 * Die `userId` stammt aus dem bereits geprüften Refresh-Token (die
 * Passport-Strategie hat die Signatur validiert, bevor dieser Command entsteht).
 * Das `refreshToken` wird trotzdem mitgegeben, denn die Signatur allein genügt
 * nicht: Es muss zusätzlich zu dem passen, was beim Nutzer hinterlegt ist -
 * sonst wäre ein abgemeldetes oder bereits benutztes Token weiter gültig.
 */
export class RefreshSessionCommand extends Command<LoginResult> {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
  ) {
    super();
  }
}
