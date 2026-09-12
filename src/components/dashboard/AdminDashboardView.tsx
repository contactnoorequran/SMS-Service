import React, { useState, useEffect, useCallback } from 'react';
import { DashboardResponseData } from '../../types/dashboard';
import { apiClient } from '../../services/api';
import { ExecutiveStatsSection } from './ExecutiveStatsSection';
import { SmsVolumeChart } from './charts/SmsVolumeChart';
import { EarningsChart } from './charts/EarningsChart';
import { NumberInventoryChart } from './charts/NumberInventoryChart';
import { ProviderTrafficTable } from './ProviderTrafficTable';
import { RecentActivityFeed } from './RecentActivityFeed';
import { QuickSimulationModal } from './QuickSimulationModal';
import { StatCardSkeleton, ChartSkeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  RefreshCw,
  Send,
  Sparkles,
  Layers,
  Database,
  ArrowUpRight,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigateToTab: (tabId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateToTab }) => {
  const [data, setData] = useState<DashboardResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchDashboardStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await apiClient.getDashboardStats();
      setData(stats);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    // Auto refresh every 45s
    const timer = setInterval(fetchDashboardStats, 45000);
    return () => clearInterval(timer);
  }, [fetchDashboardStats]);

  if (error && !data) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load Admin Dashboard Metrics"
          message="Could not retrieve real-time telemetry from platform API services. Check your connection or retry."
          error={error}
          onRetry={fetchDashboardStats}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl text-white shadow-sm border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Phase 04: Super Admin Dashboard & Operations Live
              </Badge>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Real-time Aggregation
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Executive Telemetry & Gateway Operations
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Real-time monitoring for multi-provider HTTP/SMPP gateway traffic, E.164 phone number allocations, carrier delivery confirmations, and client prepaid billing ledgers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              id="btn-simulate-inbound"
              variant="primary"
              size="sm"
              onClick={() => setIsSimulateModalOpen(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Simulate Inbound SMS
            </Button>

            <Button
              id="btn-refresh-dashboard"
              variant="outline"
              size="sm"
              onClick={fetchDashboardStats}
              isLoading={isLoading}
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Quick System Telemetry Strip */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Gateways: <strong className="text-white font-mono">{data?.summary.healthyGateways || 2} Online</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>RBAC: <strong className="text-white font-mono">Enforced (4 Roles)</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Database: <strong className="text-white font-mono">28 Normalized Models</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 justify-end font-mono text-[11px]">
            Updated: {lastRefreshedAt.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* KPI Cards Section */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : data ? (
        <ExecutiveStatsSection
          metrics={data.metrics}
          summary={data.summary}
          onNavigateToTab={onNavigateToTab}
        />
      ) : null}

      {/* Primary Analytics Charts Section */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={280} />
          <ChartSkeleton height={280} />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Charts Row 1: SMS Traffic & Earnings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SmsVolumeChart data={data.charts.smsVolume} />
            <EarningsChart data={data.charts.earnings} />
          </div>

          {/* Charts Row 2: Number Inventory & Gateway Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <NumberInventoryChart data={data.charts.numberInventory} />
            </div>
            <div className="lg:col-span-2">
              <ProviderTrafficTable
                providers={data.charts.providerTraffic}
                onSelectProvider={() => onNavigateToTab('providers')}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Activity Timeline */}
      {data && (
        <RecentActivityFeed
          items={data.recentActivity}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* Inbound Simulator Modal */}
      <QuickSimulationModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onSuccess={fetchDashboardStats}
      />
    </div>
  );
};
