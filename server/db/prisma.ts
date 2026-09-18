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
      let dbUrl = env.DATABASE_URL;
      if (dbUrl && dbUrl.includes('pooler.supabase.com')) {
        if (!dbUrl.includes('pgbouncer=true')) {
          dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
        }
        if (!dbUrl.includes('connection_limit=')) {
          dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=1';
        }
      }
      const client = new PrismaClient({
        datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
        log:
          env.LOG_LEVEL === 'debug'
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' },
              ]
            : [{ emit: 'stdout', level: 'error' }],
      });

      function wrapWithHealing(targetObj: any): any {
        return new Proxy(targetObj, {
          get(target, prop, receiver) {
            const val = Reflect.get(target, prop, receiver);
            if (typeof val === 'function') {
              return async function (...args: any[]) {
                try {
                  return await val.apply(target, args);
                } catch (err: any) {
                  if (
                    err?.message?.includes("Can't reach database server") ||
                    err?.message?.includes('connection reset') ||
                    err?.code === 'P1001' ||
                    err?.code === 'P1002'
                  ) {
                    dbLogger.warn('Prisma socket disconnected. Resetting client instance for auto-healing.');
                    prismaInstance = null;
                    try {
                      await client.$disconnect();
                    } catch {}
                  }
                  throw err;
                }
              };
            }
            if (val && typeof val === 'object') {
              return wrapWithHealing(val);
            }
            return val;
          },
        });
      }

      prismaInstance = wrapWithHealing(client) as PrismaClient;
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
    // Auto-heal: reset stale instance so next call re-establishes connection
    if (prismaInstance) {
      prismaInstance.$disconnect().catch(() => {});
      prismaInstance = null;
    }
    return {
      status: 'DISCONNECTED',
      provider: 'postgresql',
      message: `Database unreachable: ${message}`,
    };
  }
}

export async function resetPrismaClient(): Promise<void> {
  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
    } catch {}
    prismaInstance = null;
  }
}

export async function disconnectDb(): Promise<void> {
  if (prismaInstance) {
    dbLogger.info('Disconnecting Prisma client...');
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
