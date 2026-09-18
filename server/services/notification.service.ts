import { getPrismaClient } from '../db/prisma';
import crypto from 'crypto';

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'SYSTEM' | 'SECURITY' | 'NUMBERS' | 'BILLING';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// In-memory persistent notification collection (starts empty, populated only by real system events)
let inMemoryNotifications: AppNotification[] = [];

export class NotificationService {
  static async listUserNotifications(userId?: string): Promise<{ items: AppNotification[]; unreadCount: number }> {
    const prisma = getPrismaClient();

    if (prisma && userId) {
      try {
        const dbNotifs = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        if (dbNotifs && dbNotifs.length > 0) {
          const items: AppNotification[] = dbNotifs.map((n: any) => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.body || n.message || '',
            type: n.type === 'ALERT' ? 'ERROR' : n.type || 'INFO',
            category: 'SYSTEM',
            isRead: n.readAt !== null,
            createdAt: n.createdAt.toISOString(),
            actionUrl: n.metadata?.actionUrl || undefined,
          }));
          const unreadCount = items.filter((i) => !i.isRead).length;
          return { items, unreadCount };
        }
      } catch {
        // fall back to in-memory
      }
    }

    const unreadCount = inMemoryNotifications.filter((n) => !n.isRead).length;
    return { items: inMemoryNotifications, unreadCount };
  }

  static async markAsRead(id: string, userId?: string): Promise<boolean> {
    const prisma = getPrismaClient();
    if (prisma && userId) {
      try {
        await prisma.notification.updateMany({
          where: { id, userId },
          data: { readAt: new Date() },
        });
      } catch {
        // fallback
      }
    }

    const found = inMemoryNotifications.find((n) => n.id === id);
    if (found) {
      found.isRead = true;
      return true;
    }
    return false;
  }

  static async markAllAsRead(userId?: string): Promise<number> {
    const prisma = getPrismaClient();
    if (prisma && userId) {
      try {
        const res = await prisma.notification.updateMany({
          where: { userId, readAt: null },
          data: { readAt: new Date() },
        });
        return res.count;
      } catch {
        // fallback
      }
    }

    let count = 0;
    for (const n of inMemoryNotifications) {
      if (!n.isRead) {
        n.isRead = true;
        count++;
      }
    }
    return count;
  }

  static async addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<AppNotification> {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif-${crypto.randomUUID()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    inMemoryNotifications.unshift(newNotif);

    const prisma = getPrismaClient();
    if (prisma && notification.userId) {
      try {
        const notifType = notification.type === 'ERROR' ? 'ALERT' : notification.type === 'WARNING' ? 'WARNING' : 'INFO';
        await prisma.notification.create({
          data: {
            id: newNotif.id,
            organizationId: '00000000-0000-0000-0000-000000000001',
            userId: notification.userId,
            title: notification.title,
            body: notification.message,
            type: notifType as any,
          },
        });
      } catch {
        // fallback
      }
    }

    return newNotif;
  }
}
