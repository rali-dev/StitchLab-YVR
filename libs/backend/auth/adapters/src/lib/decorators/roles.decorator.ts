import { SetMetadata } from '@nestjs/common';
import type { Role } from '@stitchlab-yvr/shared-contracts';

export const ROLES_KEY = 'roles';

/**
 * Markiert eine Route als nur für bestimmte Rollen zugänglich:
 * `@Roles('ADMIN')`.
 *
 * Der Decorator selbst prüft **nichts** - er hinterlegt nur eine Notiz am
 * Handler. Erst der `RolesGuard` liest sie aus. Deshalb ist `@Roles` ohne
 * `@UseGuards(JwtAuthGuard, RolesGuard)` wirkungslos: eine Falle, gegen die es
 * einen eigenen Test gibt.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
