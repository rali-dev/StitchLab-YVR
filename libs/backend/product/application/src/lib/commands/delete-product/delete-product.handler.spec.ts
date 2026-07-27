import {
  ProductEntity,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import { ResourceNotFoundException } from '@stitchlab-yvr/shared-contracts';
import { DeleteProductCommand } from './delete-product.command.js';
import { DeleteProductHandler } from './delete-product.handler.js';

describe('DeleteProductHandler', () => {
  let products: jest.Mocked<IProductRepository>;
  let handler: DeleteProductHandler;

  beforeEach(() => {
    products = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsBySlug: jest.fn(),
    };
    handler = new DeleteProductHandler(products);
  });

  it('deletes an existing product', async () => {
    const existing = ProductEntity.create({
      slug: 'linen-scarf',
      name: 'Linen Scarf',
      priceCents: 2500,
    });
    products.findById.mockResolvedValue(existing);

    await handler.execute(new DeleteProductCommand(existing.id));

    expect(products.delete).toHaveBeenCalledWith(existing.id);
  });

  // Ein DELETE auf eine unbekannte Id soll nicht so tun, als haette es
  // gewirkt - sonst bleibt ein Tippfehler in der Id unbemerkt.
  it('reports absence instead of silently succeeding', async () => {
    products.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteProductCommand('missing-id')),
    ).rejects.toThrow(ResourceNotFoundException);
    expect(products.delete).not.toHaveBeenCalled();
  });
});
