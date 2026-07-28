import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@stitchlab-yvr/shared-contracts';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const contextWith = (user: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  const guardRequiring = (roles: Role[] | undefined) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(roles),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('lets an admin through an ADMIN-only route', () => {
    const guard = guardRequiring([Role.ADMIN]);

    expect(guard.canActivate(contextWith({ role: Role.ADMIN }))).toBe(true);
  });

  // Angemeldet, aber nicht berechtigt: `false` beantwortet NestJS mit 403.
  it('refuses a plain user on an ADMIN-only route', () => {
    const guard = guardRequiring([Role.ADMIN]);

    expect(guard.canActivate(contextWith({ role: Role.USER }))).toBe(false);
  });

  it('allows any listed role', () => {
    const guard = guardRequiring([Role.USER, Role.ADMIN]);

    expect(guard.canActivate(contextWith({ role: Role.USER }))).toBe(true);
    expect(guard.canActivate(contextWith({ role: Role.ADMIN }))).toBe(true);
  });

  it('stays out of the way when no role is required', () => {
    expect(guardRequiring(undefined).canActivate(contextWith({ role: Role.USER }))).toBe(
      true,
    );
    expect(guardRequiring([]).canActivate(contextWith({ role: Role.USER }))).toBe(
      true,
    );
  });

  // Fail-closed: Fehlt `request.user`, wurde der Guard ohne vorgeschalteten
  // JwtAuthGuard eingesetzt. Ein solcher Konfigurationsfehler darf niemals in
  // offenen Zugriff münden.
  it('refuses when there is no authenticated user at all', () => {
    const guard = guardRequiring([Role.ADMIN]);

    expect(() => guard.canActivate(contextWith(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('refuses a user object without a role', () => {
    const guard = guardRequiring([Role.ADMIN]);

    expect(() => guard.canActivate(contextWith({ sub: 'id' }))).toThrow(
      UnauthorizedException,
    );
  });

  // Ein zugeschmuggeltes `role: 'SUPERADMIN'` darf nicht durchrutschen -
  // geprüft wird gegen die Liste, nicht auf "irgendeine Rolle vorhanden".
  it('refuses an unknown role value', () => {
    const guard = guardRequiring([Role.ADMIN]);

    expect(guard.canActivate(contextWith({ role: 'SUPERADMIN' }))).toBe(false);
  });
});
