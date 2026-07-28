import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { BackendAuthAdaptersModule } from '@stitchlab-yvr/backend-auth-adapters';
import { BackendAuthInfrastructureModule } from '@stitchlab-yvr/backend-auth-infrastructure';
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
 * Handler sein Repository anfordert. Das Adapters-Modul bringt die
 * Application-Schicht ueber seinen eigenen Import mit - deshalb steht sie hier
 * nicht noch einmal.
 *
 * `ConfigModule` steht zuerst und `isGlobal`, damit `AuthConfig` beim Hochfahren
 * an die Umgebungsvariablen kommt. Fehlt oder taugt ein JWT-Secret nicht, bricht
 * der Start an dieser Stelle bewusst ab (ADR-0007).
 *
 * Der `DomainExceptionFilter` wird ueber `APP_FILTER` registriert und nicht in
 * `main.ts` instanziiert: nur so bekommt er den `HttpAdapterHost` per DI.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    BackendAuthInfrastructureModule,
    BackendAuthAdaptersModule,

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
