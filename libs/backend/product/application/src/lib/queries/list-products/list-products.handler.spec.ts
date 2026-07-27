import {
  ProductEntity,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import { ListProductsQuery } from './list-products.query.js';
import { ListProductsHandler } from './list-products.handler.js';

describe('ListProductsHandler', () => {
  let products: jest.Mocked<IProductRepository>;
  let handler: ListProductsHandler;

  beforeEach(() => {
    products = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsBySlug: jest.fn(),
    };
    handler = new ListProductsHandler(products);
  });

  it('passes the filter through to the repository', async () => {
    products.findAll.mockResolvedValue([]);

    await handler.execute(new ListProductsQuery(true, true));

    expect(products.findAll).toHaveBeenCalledWith({
      onlyPublished: true,
      onlyShowcased: true,
    });
  });

  it('maps entities to DTOs', async () => {
    products.findAll.mockResolvedValue([
      ProductEntity.create({
        slug: 'linen-scarf',
        name: 'Linen Scarf',
        priceCents: 2500,
      }),
    ]);

    const result = await handler.execute(new ListProductsQuery(true, false));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ slug: 'linen-scarf', priceCents: 2500 });
    // Der Vertrag nach aussen kennt keine Value Objects.
    expect(typeof result[0].slug).toBe('string');
    expect(typeof result[0].createdAt).toBe('string');
  });

  it('returns an empty list rather than null when nothing matches', async () => {
    products.findAll.mockResolvedValue([]);

    await expect(handler.execute(new ListProductsQuery(true, false))).resolves.toEqual(
      [],
    );
  });
});
