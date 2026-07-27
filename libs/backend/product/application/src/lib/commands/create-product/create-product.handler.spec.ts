import { EventBus } from '@nestjs/cqrs';
import {
  ProductCreatedEvent,
  ProductEntity,
  type IProductRepository,
} from '@stitchlab-yvr/backend-product-domain';
import {
  DomainException,
  ResourceConflictException,
} from '@stitchlab-yvr/shared-contracts';
import { CreateProductCommand } from './create-product.command.js';
import { CreateProductHandler } from './create-product.handler.js';

describe('CreateProductHandler', () => {
  let products: jest.Mocked<IProductRepository>;
  let eventBus: { publish: jest.Mock };
  let handler: CreateProductHandler;

  beforeEach(() => {
    // Gegen das Interface gemockt, nicht gegen Prisma: dieser Test braucht
    // keine Datenbank und laeuft in Millisekunden.
    products = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      existsBySlug: jest.fn(),
    };
    eventBus = { publish: jest.fn() };
    handler = new CreateProductHandler(
      products,
      eventBus as unknown as EventBus,
    );

    products.existsBySlug.mockResolvedValue(false);
    // Das Repository gibt zurueck, was es gespeichert hat.
    products.save.mockImplementation(async (product) => product);
  });

  const command = new CreateProductCommand(
    'embroidered-tote-bag',
    'Embroidered Tote Bag',
    4999,
    'Hand-stitched canvas tote.',
  );

  it('persists the product and returns it as a DTO', async () => {
    const result = await handler.execute(command);

    expect(products.save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      slug: 'embroidered-tote-bag',
      name: 'Embroidered Tote Bag',
      priceCents: 4999,
      description: 'Hand-stitched canvas tote.',
      isPublished: true,
      isShowcased: false,
    });
    expect(result.createdAt).toBe(new Date(result.createdAt).toISOString());
  });

  it('hands a validated entity to the repository, not the raw command', async () => {
    await handler.execute(command);

    const saved = products.save.mock.calls[0][0];
    expect(saved).toBeInstanceOf(ProductEntity);
    expect(saved.slug.toString()).toBe('embroidered-tote-bag');
  });

  it('announces the creation on the event bus', async () => {
    const result = await handler.execute(command);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0];
    expect(event).toBeInstanceOf(ProductCreatedEvent);
    expect(event.productId).toBe(result.id);
    expect(event.slug).toBe('embroidered-tote-bag');
  });

  it('rejects a slug that is already taken', async () => {
    products.existsBySlug.mockResolvedValue(true);

    await expect(handler.execute(command)).rejects.toThrow(
      ResourceConflictException,
    );
    expect(products.save).not.toHaveBeenCalled();
  });

  // Die Fachregel gilt auch dann, wenn der Aufruf nicht ueber HTTP kommt: der
  // Handler verlaesst sich nicht auf die DTO-Validierung.
  it('lets domain rules reject the command before anything is stored', async () => {
    const invalid = new CreateProductCommand(
      'valid-slug',
      'Valid Name',
      4999,
      null,
      true, // showcased ...
      false, // ... aber nicht veroeffentlicht
    );

    await expect(handler.execute(invalid)).rejects.toThrow(DomainException);
    expect(products.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('does not announce anything when saving fails', async () => {
    products.save.mockRejectedValue(new Error('database is down'));

    await expect(handler.execute(command)).rejects.toThrow('database is down');
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
