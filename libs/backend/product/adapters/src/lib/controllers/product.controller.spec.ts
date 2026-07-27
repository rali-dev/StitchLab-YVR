import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import {
  CreateProductCommand,
  DeleteProductCommand,
  GetProductBySlugQuery,
  ListProductsQuery,
  UpdateProductCommand,
} from '@stitchlab-yvr/backend-product-application';
import type {
  CreateProductDto,
  UpdateProductDto,
} from '@stitchlab-yvr/shared-contracts';
import { ProductController } from './product.controller.js';

/**
 * Der Controller wird ueber das echte Nest-Testmodul gebaut, nicht per `new`:
 * so wird mitgeprueft, dass die Dependency Injection tatsaechlich verdrahtet
 * ist. Command- und QueryBus sind Attrappen - was die Handler tun, ist hier
 * nicht Gegenstand des Tests.
 */
describe('ProductController', () => {
  let controller: ProductController;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    queryBus = { execute: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = moduleRef.get(ProductController);
  });

  it('is wired up through dependency injection', () => {
    expect(controller).toBeInstanceOf(ProductController);
  });

  describe('GET /products', () => {
    it('asks for published products only', async () => {
      await controller.listProducts({});

      const query = queryBus.execute.mock.calls[0][0] as ListProductsQuery;
      expect(query).toBeInstanceOf(ListProductsQuery);
      expect(query.onlyPublished).toBe(true);
      expect(query.onlyShowcased).toBe(false);
    });

    // Der Parameter kommt als String an - die Umwandlung gehoert in den
    // Controller, nicht in ein `@Transform` im DTO (siehe ListProductsQueryDto).
    it('turns the string "true" into an active filter', async () => {
      await controller.listProducts({ showcased: 'true' });

      const query = queryBus.execute.mock.calls[0][0] as ListProductsQuery;
      expect(query.onlyShowcased).toBe(true);
    });

    it('turns the string "false" into an inactive filter', async () => {
      await controller.listProducts({ showcased: 'false' });

      const query = queryBus.execute.mock.calls[0][0] as ListProductsQuery;
      expect(query.onlyShowcased).toBe(false);
    });
  });

  describe('GET /products/:slug', () => {
    it('queries by slug and stays on the public view', async () => {
      await controller.getProduct('linen-scarf');

      const query = queryBus.execute.mock.calls[0][0] as GetProductBySlugQuery;
      expect(query).toBeInstanceOf(GetProductBySlugQuery);
      expect(query.slug).toBe('linen-scarf');
      expect(query.onlyPublished).toBe(true);
    });
  });

  describe('POST /products', () => {
    it('translates the DTO into a command', async () => {
      const dto: CreateProductDto = {
        slug: 'embroidered-tote-bag',
        name: 'Embroidered Tote Bag',
        description: 'Hand-stitched canvas tote.',
        priceCents: 4999,
        isShowcased: true,
        isPublished: true,
      };

      await controller.createProduct(dto);

      const command = commandBus.execute.mock.calls[0][0] as CreateProductCommand;
      expect(command).toBeInstanceOf(CreateProductCommand);
      expect(command).toMatchObject({
        slug: 'embroidered-tote-bag',
        name: 'Embroidered Tote Bag',
        priceCents: 4999,
        description: 'Hand-stitched canvas tote.',
        isShowcased: true,
        isPublished: true,
      });
    });

    it('goes through the command bus, never through a service', async () => {
      await controller.createProduct({
        slug: 'linen-scarf',
        name: 'Linen Scarf',
        priceCents: 2500,
      } as CreateProductDto);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /products/:id', () => {
    it('forwards id and patch unchanged', async () => {
      const dto: UpdateProductDto = { priceCents: 5999 };

      await controller.updateProduct('11111111-1111-4111-8111-111111111111', dto);

      const command = commandBus.execute.mock.calls[0][0] as UpdateProductCommand;
      expect(command).toBeInstanceOf(UpdateProductCommand);
      expect(command.id).toBe('11111111-1111-4111-8111-111111111111');
      expect(command.patch).toEqual({ priceCents: 5999 });
    });
  });

  describe('DELETE /products/:id', () => {
    it('dispatches a delete command', async () => {
      await controller.deleteProduct('11111111-1111-4111-8111-111111111111');

      const command = commandBus.execute.mock.calls[0][0] as DeleteProductCommand;
      expect(command).toBeInstanceOf(DeleteProductCommand);
      expect(command.id).toBe('11111111-1111-4111-8111-111111111111');
    });
  });
});
