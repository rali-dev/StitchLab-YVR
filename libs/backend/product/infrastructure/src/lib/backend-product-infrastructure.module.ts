import { Global, Module } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '@stitchlab-yvr/backend-product-domain';
import { PrismaProductRepository } from './repositories/prisma-product.repository.js';

/**
 * Hier wird die Dependency Inversion konkret: das Symbol-Token aus der Domaene
 * wird an die Prisma-Implementierung gebunden. Das ist die EINZIGE Stelle, an
 * der beide Seiten sich begegnen.
 *
 * `@Global()`, damit das Binding einmal im AppModule registriert wird und alle
 * Handler es sehen - ohne dass die Application-Schicht dieses Modul importieren
 * muesste (was die Schichtgrenze verletzen wuerde).
 *
 * Der `PrismaService` wird nicht bereitgestellt: er kommt aus dem ebenfalls
 * globalen `DatabaseModule`.
 */
@Global()
@Module({
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class BackendProductInfrastructureModule {}
