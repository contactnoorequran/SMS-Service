import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { Logger } from '../utils/logger';

const dbLogger = new Logger('Database');

export interface DbHealthStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'UNCONFIGURED';
  latencyMs?: number;
  provider: 'postgresql';
  message?: string;
}

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  if (!env.DATABASE_URL) {
    return null;
  }

  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient({
        log:
          env.LOG_LEVEL === 'debug'
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' },
              ]
            : [{ emit: 'stdout', level: 'error' }],
      });

      dbLogger.info('PrismaClient initialized successfully');
    } catch (error) {
      dbLogger.error('Failed to initialize PrismaClient', error);
      prismaInstance = null;
    }
  }

  return prismaInstance;
}

export async function checkDbHealth(): Promise<DbHealthStatus> {
  if (!env.DATABASE_URL) {
    return {
      status: 'UNCONFIGURED',
      provider: 'postgresql',
      message: 'DATABASE_URL is not configured in environment variables (.env)',
    };
  }

  const client = getPrismaClient();
  if (!client) {
    return {
      status: 'DISCONNECTED',
      provider: 'postgresql',
      message: 'Prisma client could not be instantiated',
    };
  }

  const start = Date.now();
  try {
    // Execute a lightweight query to verify connectivity
    await client.$queryRaw`SELECT 1 as health_check`;
    const latencyMs = Date.now() - start;
    return {
      status: 'CONNECTED',
      latencyMs,
      provider: 'postgresql',
      message: 'PostgreSQL database connected and responsive',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database ping failed';
    dbLogger.warn('Database health check failed:', { error: message });
    return {
      status: 'DISCONNECTED',
      provider: 'postgresql',
      message: `Database unreachable: ${message}`,
    };
  }
}

export async function disconnectDb(): Promise<void> {
  if (prismaInstance) {
    dbLogger.info('Disconnecting Prisma client...');
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
