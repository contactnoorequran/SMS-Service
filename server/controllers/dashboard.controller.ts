import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/api-response';

export class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Returns aggregated statistics, time-series charts, and recent activity feed.
   */
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const data = await DashboardService.getAdminDashboardStats();
      sendSuccess(res, data, 'Dashboard analytics retrieved successfully');
    } catch (error: any) {
      sendError(res, 500, 'DASHBOARD_STATS_ERROR', 'Failed to retrieve dashboard metrics', error.message);
    }
  }
}
