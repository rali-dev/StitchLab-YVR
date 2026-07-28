import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * "Diese Route braucht eine gültige Anmeldung."
 *
 * Aktiviert die `jwt`-Strategie: Access-Token aus dem Cookie, Signatur gegen
 * `JWT_SECRET`, Ablaufzeit geprüft. Schlägt etwas davon fehl, antwortet NestJS
 * mit 401, bevor der Controller läuft.
 *
 * Der Guard liegt in `adapters` und nicht in `infrastructure`, obwohl die
 * Strategie dort wohnt: `scope:adapters` darf laut ADR-0002 nicht auf
 * `infrastructure` zugreifen - und der ProductController muss diesen Guard
 * importieren können. Der Guard nennt nur den Strategie-**Namen**, er kennt die
 * Implementierung nicht.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
