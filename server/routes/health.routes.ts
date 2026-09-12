import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { asyncHandler } from '../utils/async-handler';

export const healthRouter = Router();

// GET /api/health -> Full system diagnostics and subsystem statuses
healthRouter.get('/', asyncHandler(HealthController.getHealth));

// GET /api/health/live -> Kubernetes / container liveness probe
healthRouter.get('/live', asyncHandler(HealthController.getLiveness));

// GET /api/health/ready -> Readiness probe
healthRouter.get('/ready', asyncHandler(HealthController.getReadiness));
