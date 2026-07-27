import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Stellt den `PrismaService` bereit. `@Global()`, damit jede Domaene ihn
 * injizieren kann, ohne das DatabaseModule ueberall erneut zu importieren -
 * die Datenbank ist ein Querschnitt (`scope:shared`).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
