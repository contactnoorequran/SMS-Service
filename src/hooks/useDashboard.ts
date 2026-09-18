import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiClient } from '../services/api';
import { DashboardResponseData, DashboardTimeRange } from '../types/dashboard';

export interface FinancialTotals {
  providerCost: number;
  clientRevenue: number;
  agentCommission: number;
  platformProfit: number;
  profitMargin: number;
}

export interface UseDashboardReturn {
  data: DashboardResponseData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  timeRange: DashboardTimeRange;
  setTimeRange: (range: DashboardTimeRange) => void;
  lastRefreshedAt: Date;
  refresh: () => Promise<void>;
  financialTotals: FinancialTotals;
}

export function useDashboard(initialRange: DashboardTimeRange = '7d'): UseDashboardReturn {
  const [data, setData] = useState<DashboardResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>(initialRange);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // In-flight guard to prevent duplicate concurrent refresh requests
  const isFetchingRef = useRef<boolean>(false);

  const fetchStats = useCallback(async (isManualRefresh: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const stats = await apiClient.getDashboardStats();
      setData(stats);
      setError(null);
      setLastRefreshedAt(new Date());
    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchStats(false);

    const interval = setInterval(() => {
      fetchStats(true);
    }, 60000); // 60s auto-refresh interval

    return () => clearInterval(interval);
  }, [fetchStats]);

  const refresh = useCallback(async () => {
    await fetchStats(true);
  }, [fetchStats]);

  // Derived financial aggregates from time-series ledger data
  const financialTotals = useMemo<FinancialTotals>(() => {
    if (!data?.charts?.earnings || data.charts.earnings.length === 0) {
      const gross = data?.metrics?.platformBalance || 0;
      const profit = data?.metrics?.totalEarnings || 0;
      const cost = gross > profit ? gross - profit : 0;
      return {
        providerCost: cost,
        clientRevenue: gross,
        agentCommission: 0.05,
        platformProfit: profit,
        profitMargin: gross > 0 ? Number(((profit / gross) * 100).toFixed(1)) : 0,
      };
    }

    const gross = data.charts.earnings.reduce((acc, curr) => acc + curr.grossRevenue, 0);
    const cost = data.charts.earnings.reduce((acc, curr) => acc + curr.providerCost, 0);
    const comm = data.charts.earnings.reduce((acc, curr) => acc + curr.agentCommission, 0);
    const profit = data.charts.earnings.reduce((acc, curr) => acc + curr.netProfit, 0);
    const margin = gross > 0 ? Number(((profit / gross) * 100).toFixed(1)) : 0;

    return {
      providerCost: Number(cost.toFixed(4)),
      clientRevenue: Number(gross.toFixed(4)),
      agentCommission: Number(comm.toFixed(4)),
      platformProfit: Number(profit.toFixed(4)),
      profitMargin: margin,
    };
  }, [data]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    timeRange,
    setTimeRange,
    lastRefreshedAt,
    refresh,
    financialTotals,
  };
}
