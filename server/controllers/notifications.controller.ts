import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/api-response';

export class NotificationsController {
  /**
   * GET /api/notifications
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await NotificationService.listUserNotifications(userId);
      sendSuccess(res, result, 'Notifications retrieved');
    } catch (error: any) {
      sendError(res, 500, 'NOTIFICATIONS_FETCH_ERROR', 'Failed to retrieve notifications', error.message);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  static async markRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const success = await NotificationService.markAsRead(id, userId);
      sendSuccess(res, { read: success }, 'Notification marked as read');
    } catch (error: any) {
      sendError(res, 500, 'NOTIFICATIONS_UPDATE_ERROR', 'Failed to update notification', error.message);
    }
  }

  /**
   * POST /api/notifications/mark-all-read
   */
  static async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const count = await NotificationService.markAllAsRead(userId);
      sendSuccess(res, { count }, 'All notifications marked as read');
    } catch (error: any) {
      sendError(res, 500, 'NOTIFICATIONS_UPDATE_ERROR', 'Failed to mark all as read', error.message);
    }
  }
}
