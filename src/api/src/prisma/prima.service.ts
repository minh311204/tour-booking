import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';
import { join } from 'path';

// Ensure the expected environment file is loaded when running from the repo root.
// In production the process may run from dist/, so we load the source .env directly.
config({ path: join(process.cwd(), 'src/api/.env') });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  constructor() {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error('Missing DATABASE_URL environment variable (expected in src/api/.env or process environment).');
    }

    super({
      adapter: new PrismaMariaDb(url),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}