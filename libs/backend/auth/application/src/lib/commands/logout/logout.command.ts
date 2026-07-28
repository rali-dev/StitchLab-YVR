import { Command } from '@nestjs/cqrs';

/**
 * Absicht: "beende meine Sitzung".
 *
 * Braucht nur die Nutzer-Id (aus dem geprüften Access-Token) - das Löschen des
 * Cookies allein wäre kein Logout: Wer das Refresh-Token vorher kopiert hat,
 * könnte damit weiterarbeiten. Erst das Entfernen des Hashes in der Datenbank
 * beendet die Sitzung wirklich.
 */
export class LogoutCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}
