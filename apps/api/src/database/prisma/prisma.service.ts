import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is required');
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,

      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? [
              {
                emit: 'event',
                level: 'error',
              },
              {
                emit: 'event',
                level: 'warn',
              },
            ]
          : [
              {
                emit: 'event',
                level: 'error',
              },
            ],
    });

    this.$on('error', (event) => {
      this.logger.error(event.message);
    });

    this.$on('warn', (event) => {
      this.logger.warn(event.message);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();

    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();

    this.logger.log('Disconnected from PostgreSQL');
  }
}
