import React from 'react';
import { MetricCardData } from '../../types/dashboard';
import { FinancialTotals } from '../../hooks/useDashboard';
import { StatCard } from '../ui/Card';
import {
  Hash,
  CheckCircle2,
  MessageSquare,
  Users,
  Layers,
  TrendingUp,
  Building2,
  DollarSign,
} from 'lucide-react';
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
      {/* Row 1: Operational Metrics */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Platform Operational Metrics
          </h2>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            E.164 & Carrier Telemetry
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Numbers */}
          <StatCard
            id="stat-total-numbers"
            title="Total Numbers"
            value={formatNumber(metrics.totalNumbers)}
            subtitle={`${formatNumber(metrics.unassignedNumbers)} available in pool`}
            icon={<Hash className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
            badge={
              <Badge variant="info" size="sm">
                E.164 Pool
              </Badge>
            }
            onClick={() => onNavigateToTab?.('numbers')}
          />

          {/* 2. Active Numbers */}
          <StatCard
            id="stat-active-numbers"
            title="Active Numbers"
            value={formatNumber(metrics.assignedNumbers)}
            subtitle={`${summary.platformUtilizationRate}% pool utilization`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
            badge={
              <Badge variant="success" size="sm">
                Allocated
              </Badge>
            }
            onClick={() => onNavigateToTab?.('numbers')}
          />

          {/* 3. Messages Today */}
          <StatCard
            id="stat-messages-today"
            title="Messages Today"
            value={formatNumber(metrics.smsToday)}
            subtitle={`${formatNumber(metrics.smsThisWeek)} msgs this week`}
            icon={<MessageSquare className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)]"
            badge={
              <Badge variant="info" size="sm">
                Inbound
              </Badge>
            }
            onClick={() => onNavigateToTab?.('traffic')}
          />

          {/* 4. Active Clients */}
          <StatCard
            id="stat-active-clients"
            title="Active Clients"
            value={formatNumber(metrics.totalClients)}
            subtitle="Enterprise tenant accounts"
            icon={<Users className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-violet-dim)] text-[var(--accent-violet)]"
            badge={
              <Badge variant="purple" size="sm">
                Tenants
              </Badge>
            }
            onClick={() => onNavigateToTab?.('clients')}
          />
        </div>
      </div>

      {/* Row 2: Financial Clearing & Margins */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Financial Ledger & Clearing
          </h2>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            Sub-Cent Settlement ({metrics.currency})
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 5. Provider Wholesale Cost */}
          <StatCard
            id="stat-provider-cost"
            title="Provider Cost"
            value={formatCurrency(financials.providerCost, metrics.currency)}
            subtitle="Wholesale carrier network charges"
            icon={<Layers className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
            badge={
              <Badge variant="neutral" size="sm">
                Wholesale
              </Badge>
            }
            onClick={() => onNavigateToTab?.('financials')}
          />

          {/* 6. Client Gross Revenue */}
          <StatCard
            id="stat-client-revenue"
            title="Client Revenue"
            value={formatCurrency(financials.clientRevenue, metrics.currency)}
            subtitle="Gross customer traffic billing"
            icon={<TrendingUp className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
            badge={
              <Badge variant="success" size="sm">
                Billings
              </Badge>
            }
            onClick={() => onNavigateToTab?.('financials')}
          />

          {/* 7. Agent Commission */}
          <StatCard
            id="stat-agent-commission"
            title="Agent Commission"
            value={formatCurrency(financials.agentCommission, metrics.currency)}
            subtitle="Portfolio partner payouts"
            icon={<Building2 className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-violet-dim)] text-[var(--accent-violet)]"
            badge={
              <Badge variant="purple" size="sm">
                Commission
              </Badge>
            }
            onClick={() => onNavigateToTab?.('financials')}
          />

          {/* 8. Platform Net Profit */}
          <StatCard
            id="stat-platform-profit"
            title="Platform Profit"
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
            icon={<DollarSign className="w-5 h-5" />}
            iconBgColor="bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]"
            badge={
              <Badge variant="warning" size="sm">
                Net Margin
              </Badge>
            }
            onClick={() => onNavigateToTab?.('financials')}
          />
        </div>
      </div>
    </div>
  );
};
