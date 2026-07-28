import type { Role } from './auth.constants.js';

/**
 * Der Nutzer, wie ihn die API herausgibt.
 *
 * Was hier **fehlt**, ist der eigentliche Punkt: kein `hashedPassword`, kein
 * `hashedRefreshToken`. Diese Felder existieren in der Datenbank, verlassen den
 * Server aber niemals. Ein eigener Antwort-Typ statt der Prisma-Zeile ist genau
 * die Bremse, die verhindert, dass ein neues sensibles Feld später
 * versehentlich mit ausgeliefert wird.
 */
export interface UserDto {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}
