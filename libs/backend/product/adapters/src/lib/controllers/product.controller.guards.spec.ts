import 'reflect-metadata';
import {
  JwtAuthGuard,
  ROLES_KEY,
  RolesGuard,
} from '@stitchlab-yvr/backend-auth-adapters';
import { Role } from '@stitchlab-yvr/shared-contracts';
import { ProductController } from './product.controller.js';

/**
 * Absicherung der Zugriffsregeln - getrennt vom Verhaltenstest des Controllers.
 *
 * Warum als eigener Test: Guards sind Decorator-Metadaten. Entfernt sie jemand
 * beim Umbauen, ändert sich am Verhalten der Unit-Tests **nichts** - sie laufen
 * ohne HTTP-Schicht und damit ohne Guards. Der Endpunkt wäre still öffentlich.
 * Diese Datei prüft deshalb direkt, was am Handler hängt.
 *
 * `__guards__` ist NestJS-interne Metadaten-Ablage. Der Zugriff darauf ist der
 * Preis dafür, diese Regression überhaupt fangen zu können.
 */
const guardsOf = (method: string) =>
  (Reflect.getMetadata(
    '__guards__',
    (ProductController.prototype as unknown as Record<string, object>)[method],
  ) ?? []) as unknown[];

const rolesOf = (method: string) =>
  Reflect.getMetadata(
    ROLES_KEY,
    (ProductController.prototype as unknown as Record<string, object>)[method],
  ) as Role[] | undefined;

describe('ProductController access rules', () => {
  describe.each(['createProduct', 'updateProduct', 'deleteProduct'])(
    '%s (write access)',
    (method) => {
      it('requires authentication and the admin role', () => {
        expect(guardsOf(method)).toContain(JwtAuthGuard);
        expect(guardsOf(method)).toContain(RolesGuard);
        expect(rolesOf(method)).toEqual([Role.ADMIN]);
      });

      // Die Reihenfolge ist nicht kosmetisch: Der RolesGuard liest
      // `request.user`, das erst der JwtAuthGuard bereitstellt.
      it('runs the auth guard before the roles guard', () => {
        const guards = guardsOf(method);

        expect(guards.indexOf(JwtAuthGuard)).toBeLessThan(
          guards.indexOf(RolesGuard),
        );
      });
    },
  );

  describe.each(['listProducts', 'getProduct'])('%s (public read)', (method) => {
    it('stays open to everyone', () => {
      expect(guardsOf(method)).toHaveLength(0);
      expect(rolesOf(method)).toBeUndefined();
    });
  });
});
