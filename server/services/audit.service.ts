import crypto from 'crypto';
import { LoginAuditRecord } from '../types/auth';
import { Logger } from '../utils/logger';
import { getPrismaClient } from '../db/prisma';

const auditLogger = new Logger('AuditService');

// In-memory ring buffer (holds recent 500 records for fast memory access and fallback)
const auditMemoryLog: LoginAuditRecord[] = [];
const MAX_MEMORY_LOGS = 500;

export class AuditService {
  /**
   * Records an audit event (login, logout, account locked, etc.)
   */
  static async recordEvent(event: {
    userId?: string;
    email: string;
    action: string;
    reason?: string;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<LoginAuditRecord> {
    const record: LoginAuditRecord = {
      id: crypto.randomUUID(),
      userId: event.userId,
      email: event.email,
      action: event.action,
      reason: event.reason,
      entityType: event.entityType || 'SYSTEM',
      entityId: event.entityId,
      metadata: event.metadata,
      ipAddress: event.ipAddress || '127.0.0.1',
      userAgent: event.userAgent || 'Unknown Client',
      timestamp: new Date().toISOString(),
    };

    // Add to in-memory ring buffer
    auditMemoryLog.unshift(record);
    if (auditMemoryLog.length > MAX_MEMORY_LOGS) {
      auditMemoryLog.pop();
    }

    auditLogger.info(`Audit: [${record.action}] ${record.email} - ${record.reason || 'Success'}`);

    // If Prisma is connected, persist to database audit_logs table asynchronously
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        let validDbUserId: string | null = null;
        if (event.userId) {
          const exists = await prisma.user.findUnique({
            where: { id: event.userId },
            select: { id: true },
          }).catch(() => null);
          if (exists) {
            validDbUserId = exists.id;
          }
        }

        await prisma.auditLog.create({
          data: {
            id: record.id,
            organizationId: '00000000-0000-0000-0000-000000000001',
            performedById: validDbUserId,
            entityName: event.entityType || 'AUTH_SESSION',
            entityId: event.entityId || event.userId || 'SYSTEM',
            action: event.action,
            result: event.action.includes('FAILED') ? 'FAILURE' : 'SUCCESS',
            changes: {
              email: event.email,
              reason: event.reason,
              ...(event.metadata || {}),
            },
            ipAddress: record.ipAddress,
            userAgent: record.userAgent,
          },
        });
      } catch (err) {
        // Fallback silently without throwing to prevent breaking operational flow
        auditLogger.debug('Could not persist audit record to database, retained in memory');
      }
    }

    return record;
  }

  /**
   * Retrieves audit records specifically for a user or target entity (e.g. manager ID).
   */
  static async getLogsForEntity(entityId: string, limit: number = 50): Promise<LoginAuditRecord[]> {
    const all = await this.getRecentLogs(200);
    return all
      .filter((log) => log.entityId === entityId || log.userId === entityId || (log.metadata as any)?.managerId === entityId || (log.metadata as any)?.targetUserId === entityId)
      .slice(0, limit);
  }

  /**
   * Retrieves recent audit records.
   */
  static async getRecentLogs(limit: number = 50): Promise<LoginAuditRecord[]> {
    const combined: LoginAuditRecord[] = [...auditMemoryLog];
    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const dbLogs = await prisma.auditLog.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { performedBy: { select: { email: true } } },
        });

        for (const log of dbLogs) {
          if (!combined.some((r) => r.id === log.id)) {
            const changes = log.changes as Record<string, any> | null;
            combined.push({
              id: log.id,
              userId: log.performedById || undefined,
              email: changes?.email || log.performedBy?.email || 'system',
              action: log.action as any,
              reason: changes?.reason,
              ipAddress: log.ipAddress || undefined,
              userAgent: log.userAgent || undefined,
              timestamp: log.createdAt.toISOString(),
            });
          }
        }
      } catch (err) {
        // Use in-memory fallback
      }
    }

    combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return combined.slice(0, limit);
  }
}
