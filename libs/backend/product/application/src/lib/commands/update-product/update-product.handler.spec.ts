import {
  ProductEntity,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import {
  DomainException,
  ResourceConflictException,
  ResourceNotFoundException,
} from '@stitchlab-yvr/shared-contracts';
import { UpdateProductCommand } from './update-product.command.js';
import { UpdateProductHandler } from './update-product.handler.js';

describe('UpdateProductHandler', () => {
  let products: jest.Mocked<IProductRepository>;
  let handler: UpdateProductHandler;
  let existing: ProductEntity;

  beforeEach(() => {
    products = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsBySlug: jest.fn(),
    };
    handler = new UpdateProductHandler(products);

    existing = ProductEntity.create({
      slug: 'embroidered-tote-bag',
      name: 'Embroidered Tote Bag',
      priceCents: 4999,
    });

    products.findById.mockResolvedValue(existing);
    products.existsBySlug.mockResolvedValue(false);
    products.save.mockImplementation(async (product) => product);
  });

  it('applies the patch and returns the updated DTO', async () => {
    const result = await handler.execute(
      new UpdateProductCommand(existing.id, { priceCents: 5999 }),
    );

    expect(result.priceCents).toBe(5999);
    expect(result.slug).toBe('embroidered-tote-bag');
    expect(products.save).toHaveBeenCalledTimes(1);
  });

  it('reports 404-worthy absence when the product does not exist', async () => {
    products.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateProductCommand('missing-id', { name: 'X' })),
    ).rejects.toThrow(ResourceNotFoundException);
    expect(products.save).not.toHaveBeenCalled();
  });

  it('rejects a slug that another product already uses', async () => {
    products.existsBySlug.mockResolvedValue(true);

    await expect(
      handler.execute(
        new UpdateProductCommand(existing.id, { slug: 'taken-slug' }),
      ),
    ).rejects.toThrow(ResourceConflictException);
    expect(products.save).not.toHaveBeenCalled();
  });

  it('excludes the product itself from the slug check', async () => {
    await handler.execute(
      new UpdateProductCommand(existing.id, { slug: 'new-slug' }),
    );

    expect(products.existsBySlug).toHaveBeenCalledWith('new-slug', existing.id);
  });

  // Sonst wuerde ein Produkt beim Speichern mit sich selbst kollidieren.
  it('skips the slug check when the slug is unchanged', async () => {
    await handler.execute(
      new UpdateProductCommand(existing.id, {
        slug: 'embroidered-tote-bag',
        priceCents: 1,
      }),
    );

    expect(products.existsBySlug).not.toHaveBeenCalled();
    expect(products.save).toHaveBeenCalledTimes(1);
  });

  it('lets the entity veto a state the patch alone looks fine for', async () => {
    products.findById.mockResolvedValue(
      ProductEntity.create({
        slug: 'showcased-piece',
        name: 'Showcased Piece',
        priceCents: 9900,
        isShowcased: true,
      }),
    );

    await expect(
      handler.execute(
        new UpdateProductCommand(existing.id, { isPublished: false }),
      ),
    ).rejects.toThrow(DomainException);
    expect(products.save).not.toHaveBeenCalled();
  });
});
