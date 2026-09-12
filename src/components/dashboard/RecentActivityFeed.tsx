import React, { useState } from 'react';
import { ActivityFeedItem } from '../../types/dashboard';
import {
  MessageSquare,
  Hash,
  ShieldCheck,
  DollarSign,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface RecentActivityFeedProps {
  items: ActivityFeedItem[];
  onNavigateToTab?: (tabId: string) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  items,
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
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'ASSIGNMENT':
        return (
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Hash className="w-4 h-4" />
          </div>
        );
      case 'FINANCE':
        return (
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        );
      case 'AUDIT':
      case 'SECURITY':
      default:
        return (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Live Platform Operations Feed
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit logs, real-time inbound CDRs, number provisioning, and wallet settlements
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('MESSAGE')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'MESSAGE'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            SMS
          </button>
          <button
            onClick={() => setFilterType('ASSIGNMENT')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'ASSIGNMENT'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Numbers
          </button>
          <button
            onClick={() => setFilterType('AUDIT')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === 'AUDIT'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Audit
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/70">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No activity events found for the selected category.
          </div>
        ) : (
          filteredItems.map((item) => {
            const targetTab = getTargetTab(item.type);
            return (
              <div
                key={item.id}
                className="py-3.5 flex items-start gap-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors group"
              >
                {renderIcon(item.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono truncate">
                      Actor: <strong className="text-slate-600 dark:text-slate-300 font-medium">{item.actor || 'System'}</strong>
                    </span>

                    {onNavigateToTab && (
                      <button
                        onClick={() => onNavigateToTab(targetTab)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px]"
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
