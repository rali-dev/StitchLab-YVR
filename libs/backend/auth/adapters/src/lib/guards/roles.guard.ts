import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@stitchlab-yvr/shared-contracts';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/** Was die `jwt`-Strategie an den Request hängt. */
interface RequestWithUser {
  user?: { role?: Role };
}

/**
 * Prüft die Rolle aus dem Token gegen die `@Roles(...)`-Notiz am Handler.
 *
 * Läuft immer NACH dem `JwtAuthGuard` - die Reihenfolge in
 * `@UseGuards(JwtAuthGuard, RolesGuard)` ist bedeutsam, denn ohne die
 * vorherige Strategie gäbe es kein `request.user`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // `getAllAndOverride` erlaubt, eine Klassen-Vorgabe an einer einzelnen
    // Methode zu überschreiben.
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Keine Rollen gefordert: Der Guard hat nichts zu entscheiden. Der Zugriff
    // ist damit nicht ungeschützt - der JwtAuthGuard davor hat bereits geprüft,
    // DASS jemand angemeldet ist.
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    // Fail-closed: Fehlt der Nutzer, wurde der Guard ohne vorgeschalteten
    // JwtAuthGuard eingesetzt. Dann wird abgelehnt statt durchgelassen - ein
    // Konfigurationsfehler darf nie zu offenem Zugriff führen.
    if (!user?.role) {
      throw new UnauthorizedException('authentication is required.');
    }

    // `false` beantwortet NestJS mit 403 - die richtige Aussage: "wir wissen,
    // wer du bist, du darfst es nur nicht".
    return required.includes(user.role);
  }
}
