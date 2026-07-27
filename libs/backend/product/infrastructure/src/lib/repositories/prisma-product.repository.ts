import { Injectable } from '@nestjs/common';
import {
  IProductRepository,
  ProductEntity,
  ProductListFilter,
} from '@stitchlab-yvr/backend-product-domain';
import {
  Prisma,
  PrismaService,
  type Product,
} from '@stitchlab-yvr/backend-shared-database';
import {
  ResourceConflictException,
  ResourceNotFoundException,
} from '@stitchlab-yvr/shared-contracts';

/** Prisma meldet mit diesem Code eine verletzte Unique-Bedingung (hier: der Slug). */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
/** Prisma meldet mit diesem Code "der zu aendernde/loeschende Datensatz existiert nicht". */
const RECORD_NOT_FOUND = 'P2025';

/**
 * Die einzige Stelle im Produkt-Kontext, die Prisma kennt.
 *
 * Sie erfuellt den Port `IProductRepository` aus der Domaene. Deshalb zeigt die
 * Abhaengigkeit nach innen: Prisma haengt an der Domaene, nicht umgekehrt - die
 * Datenbank waere austauschbar, ohne dass ein Handler sich aendert.
 */
@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductEntity | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });

    return row ? PrismaProductRepository.toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<ProductEntity | null> {
    const row = await this.prisma.product.findUnique({ where: { slug } });

    return row ? PrismaProductRepository.toEntity(row) : null;
  }

  async findAll(filter: ProductListFilter): Promise<ProductEntity[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        // Nur setzen, wenn gefiltert werden soll - `isPublished: undefined`
        // wuerde Prisma als "egal" lesen, `false` dagegen als aktiven Filter.
        ...(filter.onlyPublished ? { isPublished: true } : {}),
        ...(filter.onlyShowcased ? { isShowcased: true } : {}),
      },
      // Zweites Kriterium als Tiebreaker: ohne stabile Sortierung koennen zwei
      // in derselben Millisekunde angelegte Produkte bei jedem Aufruf die
      // Plaetze tauschen.
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    return rows.map(PrismaProductRepository.toEntity);
  }

  async save(product: ProductEntity): Promise<ProductEntity> {
    // Persistiert wird aus dem Snapshot der Entity, nie aus einem rohen DTO:
    // was hier ankommt, hat die Invarianten bereits passiert.
    const snapshot = product.toSnapshot();

    try {
      const row = await this.prisma.product.upsert({
        where: { id: snapshot.id },
        create: {
          id: snapshot.id,
          slug: snapshot.slug,
          name: snapshot.name,
          description: snapshot.description,
          priceCents: snapshot.priceCents,
          isShowcased: snapshot.isShowcased,
          isPublished: snapshot.isPublished,
          createdAt: snapshot.createdAt,
        },
        update: {
          slug: snapshot.slug,
          name: snapshot.name,
          description: snapshot.description,
          priceCents: snapshot.priceCents,
          isShowcased: snapshot.isShowcased,
          isPublished: snapshot.isPublished,
        },
        // `updatedAt` wird bewusst NICHT mitgeschickt: das Datenbankfeld traegt
        // `@updatedAt` und ist damit die verlaessliche Quelle. Der Rueckgabewert
        // bringt den echten Zeitstempel zurueck in die Domaene.
      });

      return PrismaProductRepository.toEntity(row);
    } catch (error) {
      // Der Unique-Index ist die letzte Instanz fuer die Slug-Eindeutigkeit.
      // Die Vorabpruefung im Handler kann zwei gleichzeitige Requests nicht
      // trennen - dieser Fall hier schon.
      if (PrismaProductRepository.hasCode(error, UNIQUE_CONSTRAINT_VIOLATION)) {
        throw new ResourceConflictException(
          `a product with slug "${snapshot.slug}" already exists.`,
        );
      }

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      // Zwischen Existenzpruefung im Handler und diesem Aufruf kann ein
      // anderer Request geloescht haben - dann ist das Ziel erreicht, aber der
      // Aufrufer soll dieselbe Antwort bekommen wie bei einer unbekannten Id.
      if (PrismaProductRepository.hasCode(error, RECORD_NOT_FOUND)) {
        throw new ResourceNotFoundException(`product "${id}" does not exist.`);
      }

      throw error;
    }
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const found = await this.prisma.product.findFirst({
      // `excludeId` blendet das Produkt aus, das gerade bearbeitet wird -
      // sonst kollidiert es beim Update mit seinem eigenen Slug.
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });

    return found !== null;
  }

  /**
   * Row -> Entity ueber `restore`: die Value Objects werden neu aufgebaut und
   * die Invarianten erneut geprueft. Das ist gewollt teurer als ein Cast -
   * dafuer koennen kaputte Altdaten nicht unbemerkt durch die Anwendung laufen.
   */
  private static toEntity(row: Product): ProductEntity {
    return ProductEntity.restore({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      priceCents: row.priceCents,
      isShowcased: row.isShowcased,
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private static hasCode(error: unknown, code: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }
}
