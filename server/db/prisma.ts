import { productionDatabase } from '../services/production-store';
import { PrismaClient } from '@prisma/client';
import dns from 'dns';
import { env } from '../config/env';
import { Logger } from '../utils/logger';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  if (typeof (dns as any).setDefaultResultOrder === 'function') {
    (dns as any).setDefaultResultOrder('ipv4first');
  }
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const dbLogger = new Logger('Database');

export interface DbHealthStatus {
  status: 'CONNECTED' | 'DISCONNECTED' | 'UNCONFIGURED';
  latencyMs?: number;
  provider: 'postgresql';
  message?: string;
}

let prismaInstance: PrismaClient | null = null;
let dbFailureCount = 0;
let lastDbFailureTimestamp = 0;
const DB_FAILURE_COOLDOWN_MS = 5000; // 5 seconds fast recovery cooldown

export function isDbCircuitOpen(): boolean {
  if (dbFailureCount >= 1 && Date.now() - lastDbFailureTimestamp < DB_FAILURE_COOLDOWN_MS) {
    return true; // circuit open: do not attempt to hit DB, use in-memory store instantly
  }
  return false;
}

export function recordDbFailure() {
  dbFailureCount++;
  lastDbFailureTimestamp = Date.now();
  if (prismaInstance) {
    prismaInstance.$disconnect().catch(() => {});
    prismaInstance = null;
  }
}

export function recordDbSuccess() {
  dbFailureCount = 0;
}

export function getPrismaClient(): PrismaClient | null {
  if (env.NODE_ENV === 'production') return productionDatabase();
  if (!env.DATABASE_URL || isDbCircuitOpen()) {
    return null;
  }

  if (!prismaInstance) {
    try {
      let dbUrl = env.DATABASE_URL;
      if (dbUrl) {
        if (!dbUrl.includes('connect_timeout=')) {
          dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connect_timeout=10';
        }
        if (dbUrl.includes('pooler.supabase.com')) {
          if (!dbUrl.includes('pgbouncer=true')) {
            dbUrl += '&pgbouncer=true';
          }
          if (!dbUrl.includes('connection_limit=')) {
            dbUrl += '&connection_limit=5';
          }
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
                  const queryPromise = Promise.resolve(val.apply(target, args));
                  const queryTimeoutMs = Number(process.env.DB_QUERY_TIMEOUT_MS) || 10000;
                  const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Database query timed out (${queryTimeoutMs}ms)`)), queryTimeoutMs)
                  );
                  const res = await Promise.race([queryPromise, timeoutPromise]);
                  recordDbSuccess();
                  return res;
                } catch (err: any) {
                  if (
                    err?.message?.includes("Can't reach database server") ||
                    err?.message?.includes('connection reset') ||
                    err?.message?.includes('timed out') ||
                    err?.code === 'P1001' ||
                    err?.code === 'P1002'
                  ) {
                    dbLogger.warn('Database unreachable. Tripping circuit breaker to maintain instant API responsiveness.');
                    recordDbFailure();
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
      recordDbFailure();
      prismaInstance = null;
    }
  }

  return prismaInstance;
}

let cachedDbStatus: { status: DbHealthStatus; timestamp: number } | null = null;
const DB_HEALTH_CACHE_TTL = 15000; // 15 seconds

export async function checkDbHealth(): Promise<DbHealthStatus> {
  if (!env.DATABASE_URL) {
    return {
      status: 'UNCONFIGURED',
      provider: 'postgresql',
      message: 'DATABASE_URL is not configured in environment variables (.env)',
    };
  }

  // Return cached health if fresh
  if (cachedDbStatus && Date.now() - cachedDbStatus.timestamp < DB_HEALTH_CACHE_TTL) {
    return cachedDbStatus.status;
  }

  const client = getPrismaClient();
  if (!client) {
    const result: DbHealthStatus = {
      status: 'DISCONNECTED',
      provider: 'postgresql',
      message: 'Prisma client could not be instantiated',
    };
    cachedDbStatus = { status: result, timestamp: Date.now() };
    return result;
  }

  const start = Date.now();
  try {
    // Execute a lightweight query with a strict 1200ms timeout to prevent hanging the API
    const pingPromise = client.$queryRaw`SELECT 1 as health_check`;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database ping timeout (1200ms)')), 1200)
    );

    await Promise.race([pingPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;
    const result: DbHealthStatus = {
      status: 'CONNECTED',
      latencyMs,
      provider: 'postgresql',
      message: 'PostgreSQL database connected and responsive',
    };
    cachedDbStatus = { status: result, timestamp: Date.now() };
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database ping failed';
    dbLogger.warn('Database health check failed:', { error: message });
    // Auto-heal: reset stale instance so next call re-establishes connection
    if (prismaInstance) {
      prismaInstance.$disconnect().catch(() => {});
      prismaInstance = null;
    }
    const result: DbHealthStatus = {
      status: 'DISCONNECTED',
      provider: 'postgresql',
      message: `Database unreachable: ${message}`,
    };
    cachedDbStatus = { status: result, timestamp: Date.now() };
    return result;
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
