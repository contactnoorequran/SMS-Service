import React from 'react';
import { MetricCardData } from '../../types/dashboard';
import { FinancialTotals } from '../../hooks/useDashboard';
import { StatCard } from '../ui/Card';
import { AppIcon } from '../ui/AppIcon';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface ExecutiveStatsSectionProps {
  metrics: MetricCardData;
  summary: {
    healthyGateways: number;
    activeChannels: number;
    platformUtilizationRate: number;
  };
  financials: FinancialTotals;
  onNavigateToTab?: (tabId: string) => void;
}

export const ExecutiveStatsSection: React.FC<ExecutiveStatsSectionProps> = ({
  metrics,
  summary,
  financials,
  onNavigateToTab,
}) => {
  return (
    <div className="space-y-4">
      {/* Row 1: Operational Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Inbound SMS Traffic */}
        <StatCard
          id="stat-messages-today"
          title="Inbound Messages"
          value={formatNumber(metrics.smsToday)}
          subtitle={`${formatNumber(metrics.smsThisWeek)} messages this week`}
          icon={<AppIcon name="sms-routing" size="md" />}
          iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
          badge={
            <Badge variant="info" size="sm">
              Today
            </Badge>
          }
          onClick={() => onNavigateToTab?.('traffic')}
        />

        {/* 2. Number Inventory */}
        <StatCard
          id="stat-active-numbers"
          title="Allocated Numbers"
          value={formatNumber(metrics.assignedNumbers)}
          subtitle={`${formatNumber(metrics.totalNumbers)} total in pool`}
          icon={<AppIcon name="number-inventory" size="md" />}
          iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
          badge={
            <Badge variant="success" size="sm">
              {summary.platformUtilizationRate}% Active
            </Badge>
          }
          onClick={() => onNavigateToTab?.('numbers')}
        />

        {/* 3. Client Tenants */}
        <StatCard
          id="stat-active-clients"
          title="Active Clients"
          value={formatNumber(metrics.totalClients)}
          subtitle={`${formatNumber(metrics.totalManagers + metrics.totalAgents)} active team staff`}
          icon={<AppIcon name="users" size="md" />}
          iconBgColor="bg-[var(--accent-violet-dim)] text-[var(--accent-violet)]"
          badge={
            <Badge variant="purple" size="sm">
              Tenants
            </Badge>
          }
          onClick={() => onNavigateToTab?.('clients')}
        />

        {/* 4. Carrier Gateways */}
        <StatCard
          id="stat-carrier-gateways"
          title="Carrier Gateways"
          value={formatNumber(summary.healthyGateways)}
          subtitle={`${formatNumber(metrics.totalProviders)} total carriers configured`}
          icon={<AppIcon name="check-circle" size="md" />}
          iconBgColor="bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)]"
          badge={
            <Badge variant="info" size="sm">
              Online
            </Badge>
          }
          onClick={() => onNavigateToTab?.('providers')}
        />
      </div>

      {/* Row 2: Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 5. Gross Client Revenue */}
        <StatCard
          id="stat-client-revenue"
          title="Client Revenue"
          value={formatCurrency(financials.clientRevenue, metrics.currency)}
          subtitle="Total gross client billings"
          icon={<AppIcon name="client-revenue" size="md" />}
          iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
          onClick={() => onNavigateToTab?.('financials')}
        />

        {/* 6. Provider Wholesale Cost */}
        <StatCard
          id="stat-provider-cost"
          title="Provider Cost"
          value={formatCurrency(financials.providerCost, metrics.currency)}
          subtitle="Wholesale carrier charges"
          icon={<AppIcon name="provider-cost" size="md" />}
          iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
          onClick={() => onNavigateToTab?.('financials')}
        />

        {/* 7. Platform Net Profit */}
        <StatCard
          id="stat-platform-profit"
          title="Net Profit"
          value={formatCurrency(financials.platformProfit, metrics.currency)}
          subtitle={`${financials.profitMargin}% net margin`}
          change={
            financials.profitMargin > 0
              ? {
                  value: `${financials.profitMargin}%`,
                  trend: 'up',
                  label: 'margin',
                }
              : undefined
          }
          icon={<AppIcon name="platform-margin" size="md" />}
          iconBgColor="bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]"
          onClick={() => onNavigateToTab?.('financials')}
        />

        {/* 8. Platform Balance */}
        <StatCard
          id="stat-platform-balance"
          title="Platform Balance"
          value={formatCurrency(metrics.platformBalance, metrics.currency)}
          subtitle="Client prepaid balances"
          icon={<AppIcon name="agent-commission" size="md" />}
          iconBgColor="bg-[var(--accent-violet-dim)] text-[var(--accent-violet)]"
          onClick={() => onNavigateToTab?.('financials')}
        />
      </div>
    </div>
  );
};
