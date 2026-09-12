import os from 'os';
import { env } from '../config/env';
import { APP_CONFIG } from '../config/constants';
import { checkDbHealth, DbHealthStatus } from '../db/prisma';

export interface SystemHealthReport {
  name: string;
  version: string;
  phase: string;
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  environment: string;
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      heapUsedMb: number;
      heapTotalMb: number;
      rssMb: number;
    };
  };
  database: DbHealthStatus;
  subsystems: {
    name: string;
    phase: string;
    status: 'READY' | 'PLANNED' | 'STANDBY';
  }[];
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export class HealthService {
  async getHealthReport(): Promise<SystemHealthReport> {
    const dbStatus = await checkDbHealth();
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    // Overall status logic:
    // If DB is configured and connected, system is completely healthy.
    // If DB is unconfigured in development, system is marked degraded with informative message.
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (dbStatus.status === 'DISCONNECTED') {
      status = 'degraded';
    } else if (dbStatus.status === 'UNCONFIGURED') {
      status = 'degraded';
    }

    return {
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      phase: APP_CONFIG.phase,
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      uptimeFormatted: formatUptime(uptimeSec),
      environment: env.NODE_ENV,
      system: {
        nodeVersion: process.version,
        platform: `${os.type()} ${os.release()} (${os.arch()})`,
        memory: {
          heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        },
      },
      database: dbStatus,
      subsystems: [
        { name: 'Core Foundation & API Gateway', phase: '01', status: 'READY' },
        { name: 'Authentication & RBAC', phase: '02', status: 'READY' },
        { name: 'Database & Schema Architecture', phase: '03', status: 'READY' },
        { name: 'SMS Ranges & Numbers Inventory', phase: '04', status: 'READY' },
        { name: 'Manager Management & Hierarchy', phase: '05', status: 'READY' },
        { name: 'Agent Management & Portfolio Allocation', phase: '06', status: 'READY' },
        { name: 'Client Management & Enterprise Isolation', phase: '07', status: 'READY' },
        { name: 'SMS Routing & Provider Gateways', phase: '08', status: 'PLANNED' },
      ],
    };
  }
}

export const healthService = new HealthService();
