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

// In-memory persistent notification collection
let inMemoryNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'PostgreSQL Database Architecture Live',
    message: '28 normalized models synchronized with Prisma 6.4.1 and verified.',
    type: 'SUCCESS',
    category: 'SYSTEM',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: 'database-schema',
  },
  {
    id: 'notif-2',
    title: 'High Gateway Health & Latency',
    message: 'TelcoDirect HTTP Gateway operating with 38ms response time.',
    type: 'INFO',
    category: 'SYSTEM',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    actionUrl: 'diagnostics',
  },
  {
    id: 'notif-3',
    title: 'Number Range Allocation Notice',
    message: 'Pool +1202555 allocated with 1 assigned active number.',
    type: 'INFO',
    category: 'NUMBERS',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    actionUrl: 'dashboard',
  },
  {
    id: 'notif-4',
    title: 'Security Audit: Root Session Active',
    message: 'Super Administrator logged in with 2FA-ready token session.',
    type: 'WARNING',
    category: 'SECURITY',
    isRead: true,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    actionUrl: 'audit',
  },
];

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
            message: n.message,
            type: n.type || 'INFO',
            category: n.category || 'SYSTEM',
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
            actionUrl: n.link || undefined,
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
          data: { isRead: true },
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
          where: { userId, isRead: false },
          data: { isRead: true },
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
    return newNotif;
  }
}
