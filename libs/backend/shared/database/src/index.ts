export * from './lib/prisma.service.js';
export * from './lib/database.module.js';

/**
 * Diese Bibliothek ist die einzige Stelle, die den generierten Prisma-Client
 * kennt. Deshalb reicht sie das durch, was die Repository-Implementierungen
 * brauchen - der Rest des Backends importiert NIE aus `src/generated/`:
 *
 * - `Prisma` fuer typisierte Datenbankfehler (`Prisma.PrismaClientKnownRequestError`,
 *   z. B. P2002 = Unique-Verletzung),
 * - die Zeilen-Typen der Tabellen fuer das Mapping Row -> Entity.
 *
 * Waere der generierte Pfad ueberall direkt importiert, wuerde ein Umzug des
 * Generator-Outputs jede Datei im Repo anfassen.
 */
export { Prisma } from './generated/prisma/client.js';
export type {
  CartItem,
  Category,
  Favorite,
  Product,
  ProductCategory,
  ProductImage,
  User,
} from './generated/prisma/client.js';
