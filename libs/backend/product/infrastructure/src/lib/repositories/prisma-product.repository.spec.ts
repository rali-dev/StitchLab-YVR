import { ProductEntity } from '@stitchlab-yvr/backend-product-domain';
import { Prisma, PrismaService } from '@stitchlab-yvr/backend-shared-database';
import {
  ResourceConflictException,
  ResourceNotFoundException,
} from '@stitchlab-yvr/shared-contracts';
import { PrismaProductRepository } from './prisma-product.repository.js';

/**
 * Getestet wird die Uebersetzungsarbeit des Repositories - Filter, Mapping und
 * die Deutung von Datenbankfehlern -, nicht Prisma selbst. Dass Prisma korrekt
 * gegen Postgres spricht, ist Prismas Aufgabe und gehoert in die E2E-Tests mit
 * echter Datenbank.
 */
describe('PrismaProductRepository', () => {
  const row = {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'linen-scarf',
    name: 'Linen Scarf',
    description: null,
    priceCents: 2500,
    isShowcased: false,
    isPublished: true,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-02-01T10:00:00.000Z'),
  };

  let product: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
  };
  let repository: PrismaProductRepository;

  beforeEach(() => {
    product = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    };
    repository = new PrismaProductRepository({
      product,
    } as unknown as PrismaService);
  });

  /** Baut den Fehler, den Prisma bei einem verletzten Constraint wirft. */
  const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('constraint failed', {
      code,
      clientVersion: '7.9.0',
    });

  describe('findById / findBySlug', () => {
    it('maps a row to an entity', async () => {
      product.findUnique.mockResolvedValue(row);

      const found = await repository.findById(row.id);

      expect(found).toBeInstanceOf(ProductEntity);
      expect(found?.slug.toString()).toBe('linen-scarf');
      expect(found?.price.toCents()).toBe(2500);
    });

    it('returns null when nothing was found', async () => {
      product.findUnique.mockResolvedValue(null);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });

    it('looks a product up by its slug column', async () => {
      product.findUnique.mockResolvedValue(row);

      await repository.findBySlug('linen-scarf');

      expect(product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'linen-scarf' },
      });
    });
  });

  describe('findAll', () => {
    it('filters on published and showcased when asked to', async () => {
      product.findMany.mockResolvedValue([]);

      await repository.findAll({ onlyPublished: true, onlyShowcased: true });

      expect(product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true, isShowcased: true },
        }),
      );
    });

    // Der Kern des Filter-Kniffs: `false` heisst "nicht filtern" und darf NICHT
    // als `isPublished: false` in der Abfrage landen.
    it('omits the filters entirely when they are off', async () => {
      product.findMany.mockResolvedValue([]);

      await repository.findAll({ onlyPublished: false, onlyShowcased: false });

      expect(product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('sorts newest first with a stable tiebreaker', async () => {
      product.findMany.mockResolvedValue([]);

      await repository.findAll({ onlyPublished: true, onlyShowcased: false });

      expect(product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        }),
      );
    });
  });

  describe('save', () => {
    it('writes the entity snapshot and returns the stored state', async () => {
      product.upsert.mockResolvedValue(row);
      const entity = ProductEntity.restore(row);

      const saved = await repository.save(entity);

      expect(product.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: row.id },
          create: expect.objectContaining({ slug: 'linen-scarf' }),
          update: expect.objectContaining({ slug: 'linen-scarf' }),
        }),
      );
      expect(saved.updatedAt).toEqual(row.updatedAt);
    });

    // `updatedAt` traegt in der Datenbank `@updatedAt` - wuerde das Repository
    // einen eigenen Wert mitschicken, waeren zwei Quellen fuer dieselbe Wahrheit
    // zustaendig.
    it('leaves updatedAt to the database', async () => {
      product.upsert.mockResolvedValue(row);

      await repository.save(ProductEntity.restore(row));

      const call = product.upsert.mock.calls[0][0];
      expect(call.create).not.toHaveProperty('updatedAt');
      expect(call.update).not.toHaveProperty('updatedAt');
    });

    it('translates a unique-constraint violation into a conflict', async () => {
      product.upsert.mockRejectedValue(prismaError('P2002'));

      await expect(repository.save(ProductEntity.restore(row))).rejects.toThrow(
        ResourceConflictException,
      );
    });

    it('lets unrelated database errors through untouched', async () => {
      product.upsert.mockRejectedValue(new Error('connection reset'));

      await expect(repository.save(ProductEntity.restore(row))).rejects.toThrow(
        'connection reset',
      );
    });
  });

  describe('delete', () => {
    it('deletes by id', async () => {
      product.delete.mockResolvedValue(row);

      await repository.delete(row.id);

      expect(product.delete).toHaveBeenCalledWith({ where: { id: row.id } });
    });

    it('translates "record not found" into an absence', async () => {
      product.delete.mockRejectedValue(prismaError('P2025'));

      await expect(repository.delete(row.id)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('existsBySlug', () => {
    it('reports an existing slug', async () => {
      product.findFirst.mockResolvedValue({ id: row.id });

      await expect(repository.existsBySlug('linen-scarf')).resolves.toBe(true);
    });

    it('reports a free slug', async () => {
      product.findFirst.mockResolvedValue(null);

      await expect(repository.existsBySlug('free-slug')).resolves.toBe(false);
    });

    it('excludes the product being edited from the check', async () => {
      product.findFirst.mockResolvedValue(null);

      await repository.existsBySlug('linen-scarf', row.id);

      expect(product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'linen-scarf', id: { not: row.id } },
        }),
      );
    });
  });
});
