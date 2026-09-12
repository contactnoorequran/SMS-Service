import { Request, Response } from 'express';
import { healthService } from '../services/health.service';
import { sendSuccess } from '../utils/api-response';

export class HealthController {
  static async getHealth(_req: Request, res: Response): Promise<void> {
    const report = await healthService.getHealthReport();
    sendSuccess(res, report, 'System health report retrieved successfully');
  }

  static async getLiveness(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, { status: 'alive', timestamp: new Date().toISOString() });
  }

  static async getReadiness(_req: Request, res: Response): Promise<void> {
    const report = await healthService.getHealthReport();
    const isReady = report.status !== 'critical';
    const statusCode = isReady ? 200 : 503;
    sendSuccess(
      res,
      {
        ready: isReady,
        database: report.database.status,
        timestamp: new Date().toISOString(),
      },
      isReady ? 'Service is ready to receive traffic' : 'Service is not ready',
      statusCode,
    );
  }
}
