/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { ExecutiveStatsSection } from './ExecutiveStatsSection';
import { QuickOperationalPanels } from './QuickOperationalPanels';
import { SmsVolumeChart } from './charts/SmsVolumeChart';
import { EarningsChart } from './charts/EarningsChart';
import { CompactRecentData } from './CompactRecentData';
import { RecentActivityFeed } from './RecentActivityFeed';
import { StatCardSkeleton, ChartSkeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatRelativeTime } from '../../utils/formatters';
import {
  RefreshCw,
  ChevronRight,
  Activity,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
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
    lastRefreshedAt,
    refresh,
    financialTotals,
  } = useDashboard('7d');

  // Full page error state when no data could be loaded
  if (error && !data) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load Dashboard Telemetry"
          message="Could not retrieve operational telemetry from backend services. Check network connection or retry."
          error={error}
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Area: Clean, max 1-2 primary actions ([Refresh], optional [Search]) */}
      <div className="p-6 glass-card border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.05)] via-transparent to-[rgba(139,92,246,0.04)] pointer-events-none" />

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="relative flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] mb-2">
          <span>Platform</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <span className="text-[var(--text-primary)] font-medium">Dashboard</span>
        </nav>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Operational Telemetry Active
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono hidden sm:inline">
                Sub-Cent Decimal Clearing
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Executive Dashboard
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Real-time telecommunications operational metrics, gateway connectivity, and financial clearing.
            </p>
          </div>

          {/* Clean Controls: Time Range Selector + Refresh + Search */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Time Range Selector */}
            <div
              className="flex items-center gap-1 bg-[var(--glass-bg-active)] p-1 rounded-lg text-xs"
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
                  className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
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

            {/* Refresh Action (Preferred primary action) */}
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

        {/* Quick System Telemetry Strip */}
        <div className="relative mt-5 pt-4 border-t border-[var(--glass-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Activity className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span>Gateways: <strong className="text-[var(--text-primary)] font-mono">{data?.summary.healthyGateways ?? 2} Online</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Shield className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
            <span>RBAC: <strong className="text-[var(--text-primary)] font-mono">Enforced</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Database className="w-3.5 h-3.5 text-[var(--accent-violet)]" />
            <span>Ledger: <strong className="text-[var(--text-primary)] font-mono">Sequential Clearing</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-tertiary)] justify-end font-mono text-[11px]">
            Updated: {formatRelativeTime(lastRefreshedAt)}
          </div>
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

      {/* 2. Executive KPIs (Operational + Financial, exactly 8 cards) */}
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
          icon={<BarChart3 className="w-6 h-6" />}
          title="No Platform Metrics Available"
          description="Operational metrics have not been recorded yet. Launch gateway simulation or check connectivity."
          actionText="Refresh Telemetry"
          onAction={refresh}
        />
      )}

      {/* 3. Major Analytics Charts: SMS Volume & Financial Performance (2 charts) */}
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

      {/* 4. Operational Overview: Carrier Links, System Health, Settlements, Alerts (4 panels) */}
      {data && (
        <QuickOperationalPanels
          healthyGateways={data.summary.healthyGateways}
          totalGateways={data?.charts?.providerTraffic?.length ?? 2}
          activeChannels={data.summary.activeChannels}
          unreadNotificationsCount={2}
          pendingPaymentRequestsCount={3}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* 5. Compact Recent Data: Recent Messages & Recent Transactions (2 sections) */}
      <CompactRecentData onNavigateToTab={onNavigateToTab} />

      {/* 6. Recent Platform Activity Feed */}
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
