import {
  ProductEntity,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import { ResourceNotFoundException } from '@stitchlab-yvr/shared-contracts';
import { GetProductBySlugQuery } from './get-product-by-slug.query.js';
import { GetProductBySlugHandler } from './get-product-by-slug.handler.js';

describe('GetProductBySlugHandler', () => {
  let products: jest.Mocked<IProductRepository>;
  let handler: GetProductBySlugHandler;

  const unpublished = ProductEntity.create({
    slug: 'draft-piece',
    name: 'Draft Piece',
    priceCents: 1000,
    isPublished: false,
  });

  beforeEach(() => {
    products = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsBySlug: jest.fn(),
    };
    handler = new GetProductBySlugHandler(products);
  });

  it('returns the product as a DTO', async () => {
    products.findBySlug.mockResolvedValue(
      ProductEntity.create({
        slug: 'linen-scarf',
        name: 'Linen Scarf',
        priceCents: 2500,
      }),
    );

    const result = await handler.execute(
      new GetProductBySlugQuery('linen-scarf', true),
    );

    expect(result).toMatchObject({ slug: 'linen-scarf', name: 'Linen Scarf' });
  });

  it('reports absence for an unknown slug', async () => {
    products.findBySlug.mockResolvedValue(null);

    await expect(
      handler.execute(new GetProductBySlugQuery('nope', true)),
    ).rejects.toThrow(ResourceNotFoundException);
  });

  // Sonst waere ein unveroeffentlichtes Produkt zwar nicht in der Liste, ueber
  // seinen Slug aber trotzdem abrufbar.
  it('hides an unpublished product from the public view', async () => {
    products.findBySlug.mockResolvedValue(unpublished);

    await expect(
      handler.execute(new GetProductBySlugQuery('draft-piece', true)),
    ).rejects.toThrow(ResourceNotFoundException);
  });

  it('shows an unpublished product when the caller may see drafts', async () => {
    products.findBySlug.mockResolvedValue(unpublished);

    const result = await handler.execute(
      new GetProductBySlugQuery('draft-piece', false),
    );

    expect(result.slug).toBe('draft-piece');
    expect(result.isPublished).toBe(false);
  });
});
