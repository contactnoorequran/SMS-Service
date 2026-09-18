import React, { useState } from 'react';
import { ActivityFeedItem } from '../../types/dashboard';
import {
  MessageSquare,
  Hash,
  ShieldCheck,
  DollarSign,
  Radio,
  UserCheck,
  TrendingUp,
  Clock,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatRelativeTime } from '../../utils/formatters';

interface RecentActivityFeedProps {
  items: ActivityFeedItem[];
  isLoading?: boolean;
  onNavigateToTab?: (tabId: string) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  items,
  isLoading = false,
  onNavigateToTab,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredItems = items.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const renderIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'MESSAGE':
        return (
          <div className="p-2 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'ASSIGNMENT':
        return (
          <div className="p-2 rounded-lg bg-[var(--accent-violet-dim)] text-[var(--accent-violet)] shrink-0">
            <Hash className="w-4 h-4" />
          </div>
        );
      case 'FINANCE':
        return (
          <div className="p-2 rounded-lg bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        );
      case 'SECURITY':
        return (
          <div className="p-2 rounded-lg bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
      case 'AUDIT':
      default:
        return (
          <div className="p-2 rounded-lg bg-[var(--glass-bg-active)] text-[var(--text-secondary)] shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
    }
  };

  const getTargetTab = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'MESSAGE':
        return 'traffic';
      case 'ASSIGNMENT':
        return 'numbers';
      case 'FINANCE':
        return 'financials';
      case 'AUDIT':
      case 'SECURITY':
        return 'audit';
      default:
        return 'dashboard';
    }
  };

  const getStatusBadgeVariant = (status: ActivityFeedItem['status']): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'INFO':
        return 'info';
      case 'WARNING':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--glass-bg-active)] text-[var(--text-secondary)]">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Recent Platform Activity
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time audit log of number allocations, routed messages, payments, and gateway events
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[var(--glass-bg-active)] p-1 rounded-lg text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('MESSAGE')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'MESSAGE'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-blue)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            SMS
          </button>
          <button
            type="button"
            onClick={() => setFilterType('ASSIGNMENT')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'ASSIGNMENT'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-violet)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Numbers
          </button>
          <button
            type="button"
            onClick={() => setFilterType('FINANCE')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'FINANCE'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--accent-emerald)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Finance
          </button>
          <button
            type="button"
            onClick={() => setFilterType('AUDIT')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'AUDIT'
                ? 'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Audit
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-4 divide-y divide-[var(--glass-border)]">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-lg glass-skeleton shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 glass-skeleton w-1/3" />
                  <div className="h-3 glass-skeleton w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg-active)] flex items-center justify-center text-[var(--text-tertiary)] mb-2">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-[var(--text-primary)]">No events recorded</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              No recent activity events found for the selected category filter.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const targetTab = getTargetTab(item.type);
            return (
              <div
                key={item.id}
                className="py-3 flex items-start gap-3.5 hover:bg-[var(--glass-bg-hover)] px-2.5 rounded-lg transition-colors group"
              >
                {renderIcon(item.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {item.title}
                      </span>
                      {item.badge ? (
                        <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-tertiary)] shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                    <span className="font-mono truncate">
                      Actor: <strong className="text-[var(--text-secondary)] font-medium">{item.actor || 'System Engine'}</strong>
                    </span>

                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab(targetTab)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center gap-1 text-[var(--accent-blue)] hover:underline font-medium text-[11px] cursor-pointer"
                        aria-label={`Inspect ${item.title}`}
                      >
                        <span>Inspect module</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
