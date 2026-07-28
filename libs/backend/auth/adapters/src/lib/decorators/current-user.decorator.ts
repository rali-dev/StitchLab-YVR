import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@stitchlab-yvr/shared-contracts';

/**
 * Der angemeldete Nutzer, wie ihn die Passport-Strategie an den Request hängt.
 * Entspricht dem Token-Inhalt - kein Datenbankobjekt.
 */
export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: Role;
}

/**
 * Am Refresh-Endpunkt hängt die `jwt-refresh`-Strategie zusätzlich das rohe
 * Token an - der Handler braucht es für den Abgleich mit dem gespeicherten Hash.
 *
 * Eigener Typ statt eines optionalen Feldes am `AuthenticatedUser`: Optional
 * hieße, dass jede Route es prüfen (oder per Cast übergehen) müsste. So sagt
 * bereits die Signatur des Endpunkts, dass das Token hier vorhanden ist.
 */
export interface AuthenticatedRefreshUser extends AuthenticatedUser {
  refreshToken: string;
}

/**
 * `@CurrentUser() user: AuthenticatedUser` statt `@Req() req` und dann
 * `req.user` von Hand auspacken.
 *
 * Der Gewinn ist nicht Bequemlichkeit, sondern Typisierung: `req.user` ist bei
 * Express `any` - ein Tippfehler wie `user.id` (statt `user.sub`) fiele erst
 * zur Laufzeit auf, und zwar als stilles `undefined` in einer Datenbankabfrage.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user,
);

/**
 * Wie `@CurrentUser`, aber für den Refresh-Endpunkt: liefert zusätzlich das
 * rohe Refresh-Token.
 */
export const CurrentRefreshUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRefreshUser =>
    context.switchToHttp().getRequest<{ user: AuthenticatedRefreshUser }>()
      .user,
);
