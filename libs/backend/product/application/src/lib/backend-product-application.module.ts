import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateProductHandler } from './commands/create-product/create-product.handler.js';
import { DeleteProductHandler } from './commands/delete-product/delete-product.handler.js';
import { UpdateProductHandler } from './commands/update-product/update-product.handler.js';
import { ProductCreatedListener } from './events/product-created.listener.js';
import { GetProductBySlugHandler } from './queries/get-product-by-slug/get-product-by-slug.handler.js';
import { ListProductsHandler } from './queries/list-products/list-products.handler.js';

const COMMAND_HANDLERS = [
  CreateProductHandler,
  UpdateProductHandler,
  DeleteProductHandler,
];

const QUERY_HANDLERS = [ListProductsHandler, GetProductBySlugHandler];

const EVENT_HANDLERS = [ProductCreatedListener];

/**
 * Buendelt die Anwendungsfaelle der Produkt-Domaene.
 *
 * Auffaellig ist, was hier FEHLT: kein Import des Infrastructure-Moduls und
 * keine Prisma-Klasse. Die Handler bestellen ihre Persistenz ueber
 * `PRODUCT_REPOSITORY`; wer das Token bedient, entscheidet das AppModule. Genau
 * das macht diese Schicht ohne Datenbank testbar - und der ESLint-Constraint
 * fuer `scope:application` wuerde einen Infrastruktur-Import ohnehin ablehnen.
 *
 * `exports: [CqrsModule]` gibt Command- und QueryBus an die Adapter-Schicht
 * weiter, damit deren Controller sie injizieren koennen.
 */
@Module({
  imports: [CqrsModule],
  providers: [...COMMAND_HANDLERS, ...QUERY_HANDLERS, ...EVENT_HANDLERS],
  exports: [CqrsModule],
})
export class BackendProductApplicationModule {}
