import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { sendSuccess } from '../utils/api-response';

export class AuditController {
  /**
   * GET /api/audit-logs
   * Retrieves security and login audit trail.
   */
  static async listLogs(req: Request, res: Response): Promise<void> {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const logs = await AuditService.getRecentLogs(limit);
    sendSuccess(res, { logs, count: logs.length }, 'Audit logs retrieved', 200);
  }
}
