import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AppNotification } from '../../types/dashboard';
import { apiClient } from '../../services/api';
import { Badge } from '../ui/Badge';

interface NotificationsMenuProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ onNavigateToTab }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.getNotifications();
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    return true;
  });

  const renderIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)] shrink-0" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-[var(--accent-rose)] shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-[var(--accent-blue)] shrink-0" />;
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        id="btn-notifications-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent-blue)] text-white text-[10px] font-bold flex items-center justify-center font-mono shadow-[0_0_8px_var(--accent-blue-dim)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-surface)] border border-[var(--glass-border)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-fade-in backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <Badge variant="info" size="sm">
                  {unreadCount} unread
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[11px] font-medium text-[var(--accent-blue)] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 bg-[rgba(0,0,0,0.15)] border-b border-[var(--glass-border)] flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-[var(--glass-bg-active)] text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeFilter === 'UNREAD'
                  ? 'bg-[var(--glass-bg-active)] text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--glass-border)]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-tertiary)]">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  {activeFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Platform alerts and security notices will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.actionUrl && onNavigateToTab) {
                      onNavigateToTab(notif.actionUrl);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 transition-colors flex items-start gap-3 text-xs ${
                    notif.isRead
                      ? 'hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)]'
                      : 'bg-[var(--accent-blue-dim)] hover:bg-[rgba(59,130,246,0.12)] text-[var(--text-primary)]'
                  } ${notif.actionUrl ? 'cursor-pointer' : ''}`}
                >
                  <div className="mt-0.5">{renderIcon(notif.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 font-mono">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-tertiary)]">
                        {notif.category}
                      </span>

                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkRead(notif.id, e)}
                          className="text-[11px] text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
