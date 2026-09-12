import React from 'react';
import { MetricCardData } from '../../types/dashboard';
import { StatCard } from '../ui/Card';
import {
  Radio,
  Hash,
  MessageSquare,
  DollarSign,
  Users,
  ShieldCheck,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ExecutiveStatsSectionProps {
  metrics: MetricCardData;
  summary: {
    healthyGateways: number;
    activeChannels: number;
    platformUtilizationRate: number;
  };
  onNavigateToTab?: (tabId: string) => void;
}

export const ExecutiveStatsSection: React.FC<ExecutiveStatsSectionProps> = ({
  metrics,
  summary,
  onNavigateToTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Gateways & Providers */}
      <StatCard
        id="stat-providers"
        title="Active Gateways / Carriers"
        value={`${metrics.activeProviders} / ${metrics.totalProviders}`}
        subtitle="100% gateway uptime"
        change={{
          value: 'All Connected',
          trend: 'up',
          label: 'HTTP & SMPP',
        }}
        icon={<Radio className="w-5 h-5" />}
        iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        badge={
          <Badge variant="success" size="sm">
            Live
          </Badge>
        }
        onClick={() => onNavigateToTab?.('providers')}
      />

      {/* 2. Number Inventory (E.164 DIDs) */}
      <StatCard
        id="stat-numbers"
        title="Number Pool Inventory"
        value={`${metrics.assignedNumbers} Assigned`}
        subtitle={`${metrics.unassignedNumbers} available in pool`}
        change={{
          value: `${summary.platformUtilizationRate}%`,
          trend: 'up',
          label: 'Pool utilization',
        }}
        icon={<Hash className="w-5 h-5" />}
        iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        badge={
          <Badge variant="info" size="sm">
            {metrics.totalNumbers} DIDs
          </Badge>
        }
        onClick={() => onNavigateToTab?.('numbers')}
      />

      {/* 3. Inbound SMS Traffic */}
      <StatCard
        id="stat-sms-today"
        title="Inbound SMS Volume (Today)"
        value={metrics.smsToday.toLocaleString()}
        subtitle={`${metrics.smsThisWeek.toLocaleString()} msgs this week`}
        change={{
          value: '+14.2%',
          trend: 'up',
          label: 'vs yesterday',
        }}
        icon={<MessageSquare className="w-5 h-5" />}
        iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        badge={
          <Badge variant="success" size="sm">
            99.2% Delivered
          </Badge>
        }
        onClick={() => onNavigateToTab?.('traffic')}
      />

      {/* 4. Financial Clearing & Ledger */}
      <StatCard
        id="stat-finances"
        title="Platform Prepaid Ledger"
        value={`$${metrics.platformBalance.toFixed(2)}`}
        subtitle={`$${metrics.totalEarnings.toFixed(2)} net profit cleared`}
        change={{
          value: '49.8%',
          trend: 'up',
          label: 'Average margin',
        }}
        icon={<DollarSign className="w-5 h-5" />}
        iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        badge={
          <Badge variant="warning" size="sm">
            {metrics.currency}
          </Badge>
        }
        onClick={() => onNavigateToTab?.('financials')}
      />
    </div>
  );
};
