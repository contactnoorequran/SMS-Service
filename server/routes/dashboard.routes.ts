import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

export const dashboardRouter = Router();

// Dashboard analytics endpoint (allows viewing for admin dashboard; uses optional auth so initial load / authorized sessions can both load smoothly)
dashboardRouter.get('/stats', optionalAuth, DashboardController.getStats);
