/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { ExecutiveStatsSection } from './ExecutiveStatsSection';
import { SmsVolumeChart } from './charts/SmsVolumeChart';
import { EarningsChart } from './charts/EarningsChart';
import { CompactRecentData } from './CompactRecentData';
import { RecentActivityFeed } from './RecentActivityFeed';
import { StatCardSkeleton, ChartSkeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import {
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigateToTab: (tabId: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateToTab,
  onOpenGlobalSearch,
}) => {
  const {
    data,
    isLoading,
    isRefreshing,
    error,
    timeRange,
    setTimeRange,
    refresh,
    financialTotals,
  } = useDashboard('7d');

  // Full page error state when no data could be loaded
  if (error && !data) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load Dashboard"
          message="Could not retrieve operational telemetry from backend services. Please check connection and retry."
          error={error}
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Clean, Modern Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time overview of message traffic, number allocations, and revenue.
          </p>
        </div>

        {/* Controls: Time Range Selector + Refresh + Optional Search */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Time Range Selector */}
          <div
            className="flex items-center gap-1 bg-[var(--glass-bg-active)] p-1 rounded-xl text-xs"
            role="radiogroup"
            aria-label="Filter dashboard by time range"
          >
            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                type="button"
                role="radio"
                aria-checked={timeRange === range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-[var(--glass-bg)] text-[var(--text-primary)] shadow-xs font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {range === 'all' ? 'All' : range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Optional Global Search Button */}
          {onOpenGlobalSearch && (
            <Button
              id="btn-dashboard-search"
              variant="outline"
              size="sm"
              onClick={onOpenGlobalSearch}
              leftIcon={<Search className="w-3.5 h-3.5" />}
              aria-label="Search platform entities"
            >
              Search
            </Button>
          )}

          {/* Refresh Action */}
          <Button
            id="btn-refresh-dashboard"
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading || isRefreshing}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh dashboard telemetry"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Non-blocking refresh error banner */}
      {error && data && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.2)] text-xs text-[var(--accent-rose)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to refresh live telemetry ({error.message}). Retaining cached operational view.</span>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="font-semibold underline hover:no-underline cursor-pointer ml-3 shrink-0"
          >
            Retry Refresh
          </button>
        </div>
      )}

      {/* 2. Executive KPIs (8 real metric cards directly from database) */}
      {isLoading && !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>
      ) : data ? (
        <ExecutiveStatsSection
          metrics={data.metrics}
          summary={data.summary}
          financials={financialTotals}
          onNavigateToTab={onNavigateToTab}
        />
      ) : (
        <EmptyState
          iconName="network-analytics"
          title="No Platform Metrics Available"
          description="Operational metrics have not been recorded yet. Connect carrier gateways to view metrics."
          actionText="Refresh Telemetry"
          onAction={refresh}
        />
      )}

      {/* 3. Major Analytics Charts: SMS Volume & Financial Performance */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={280} />
          <ChartSkeleton height={280} />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SmsVolumeChart data={data.charts.smsVolume} />
          <EarningsChart data={data.charts.earnings} />
        </div>
      ) : null}

      {/* 4. Compact Recent Data: Recent Messages & Recent Transactions */}
      <CompactRecentData onNavigateToTab={onNavigateToTab} />

      {/* 5. Recent Platform Activity Feed */}
      {data && (
        <RecentActivityFeed
          items={data.recentActivity}
          isLoading={isRefreshing}
          onNavigateToTab={onNavigateToTab}
        />
      )}
    </div>
  );
};
