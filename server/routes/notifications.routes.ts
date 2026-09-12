import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

export const notificationsRouter = Router();

notificationsRouter.get('/', optionalAuth, NotificationsController.list);
notificationsRouter.patch('/:id/read', optionalAuth, NotificationsController.markRead);
notificationsRouter.post('/mark-all-read', optionalAuth, NotificationsController.markAllRead);
