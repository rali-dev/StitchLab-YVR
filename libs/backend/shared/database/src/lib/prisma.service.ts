import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * PrismaService = der generierte PrismaClient als injizierbarer Nest-Provider.
 *
 * Prisma 7 laeuft ohne die alte Rust-Query-Engine ("Query Compiler") und braucht
 * deshalb einen Driver-Adapter - hier `@prisma/adapter-pg` (node-postgres). Die
 * Verbindung kommt aus `DATABASE_URL` (Supabase Session-Pooler, siehe .env).
 *
 * `onModuleInit`/`onModuleDestroy` binden den Verbindungs-Lebenszyklus sauber an
 * den Nest-Lebenszyklus (Graceful Shutdown).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma verbunden (PostgreSQL via Session-Pooler).');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
