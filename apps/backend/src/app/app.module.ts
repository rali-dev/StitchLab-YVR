import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { BackendProductAdaptersModule } from '@stitchlab-yvr/backend-product-adapters';
import { BackendProductInfrastructureModule } from '@stitchlab-yvr/backend-product-infrastructure';
import { DatabaseModule } from '@stitchlab-yvr/backend-shared-database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DomainExceptionFilter } from './filters/domain-exception.filter';

/**
 * Der Modular Monolith wird hier zusammengesteckt.
 *
 * Reihenfolge je Domaene: erst Infrastructure, dann Adapters. Das
 * Infrastructure-Modul ist `@Global()` und muss registriert sein, bevor ein
 * Handler `PRODUCT_REPOSITORY` anfordert. Das Adapters-Modul bringt die
 * Application-Schicht ueber seinen eigenen Import mit - deshalb steht sie hier
 * nicht noch einmal.
 *
 * Der `DomainExceptionFilter` wird ueber `APP_FILTER` registriert und nicht in
 * `main.ts` instanziiert: nur so bekommt er den `HttpAdapterHost` per DI.
 */
@Module({
  imports: [
    DatabaseModule,
    BackendProductInfrastructureModule,
    BackendProductAdaptersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
