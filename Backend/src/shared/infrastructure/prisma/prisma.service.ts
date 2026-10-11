import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL;
    let configuredUrl = url;
    if (url && !url.includes('connection_limit')) {
      const separator = url.includes('?') ? '&' : '?';
      configuredUrl = `${url}${separator}connection_limit=5`;
    }

    super({
      datasources: configuredUrl
        ? {
            db: {
              url: configuredUrl,
            },
          }
        : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma conectado exitosamente a PostgreSQL');
    } catch (error) {
      this.logger.warn(
        `No se pudo conectar a la base de datos al iniciar: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
