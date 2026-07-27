import { Module } from '@nestjs/common';
import { BackendProductApplicationModule } from '@stitchlab-yvr/backend-product-application';
import { ProductController } from './controllers/product.controller.js';

/**
 * Aeusserste Schicht der Produkt-Domaene: alles, was HTTP spricht.
 *
 * Importiert die Application-Schicht (und damit ueber deren Re-Export den
 * Command-/QueryBus), aber NIE die Infrastruktur - der Controller weiss nicht,
 * dass es Prisma gibt. Dieses eine Modul wird im AppModule registriert und
 * zieht die darunterliegenden Schichten mit.
 */
@Module({
  imports: [BackendProductApplicationModule],
  controllers: [ProductController],
})
export class BackendProductAdaptersModule {}
