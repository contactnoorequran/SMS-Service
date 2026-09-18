import React from 'react';
import {
  Activity,
  Radio,
  CreditCard,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface QuickOperationalPanelsProps {
  healthyGateways: number;
  totalGateways: number;
  activeChannels: number;
  unreadNotificationsCount?: number;
  pendingPaymentRequestsCount?: number;
  onNavigateToTab?: (tabId: string) => void;
}

export const QuickOperationalPanels: React.FC<QuickOperationalPanelsProps> = ({
  healthyGateways,
  totalGateways,
  activeChannels,
  unreadNotificationsCount = 0,
  pendingPaymentRequestsCount = 0,
  onNavigateToTab,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. System Health Panel */}
      <div className="glass-card p-4 flex flex-col justify-between h-full border-[var(--glass-border)]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">System Health</span>
            </div>
            <Badge variant="success" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)] mr-1 inline-block animate-pulse-dot" />
              Online
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            PostgreSQL connection active, sub-cent decimal ledgers synchronized.
          </p>
          <div className="mt-3 space-y-1.5 text-[11px] font-mono text-[var(--text-tertiary)]">
            <div className="flex justify-between">
              <span>DB Latency:</span>
              <span className="text-[var(--text-primary)] font-semibold">Low (&lt;1s)</span>
            </div>
            <div className="flex justify-between">
              <span>Subsystems:</span>
              <span className="text-[var(--accent-emerald)] font-semibold">8 / 8 Active</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab?.('audit')}
          className="mt-3 pt-2.5 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer w-full text-left"
        >
          <span>View System Logs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Provider Connectivity Panel */}
      <div className="glass-card p-4 flex flex-col justify-between h-full border-[var(--glass-border)]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]">
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Carrier Links</span>
            </div>
            <Badge variant="info" size="sm">
              {healthyGateways}/{totalGateways} Active
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            HTTP REST & SMPP v3.4 carrier trunks operational with automated failover.
          </p>
          <div className="mt-3 space-y-1.5 text-[11px] font-mono text-[var(--text-tertiary)]">
            <div className="flex justify-between">
              <span>Carrier Uptime:</span>
              <span className="text-[var(--text-primary)] font-semibold">99.4% Avg</span>
            </div>
            <div className="flex justify-between">
              <span>Active DIDs:</span>
              <span className="text-[var(--text-primary)] font-semibold">{activeChannels} Channels</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab?.('providers')}
          className="mt-3 pt-2.5 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer w-full text-left"
        >
          <span>Manage Gateways</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Pending Payment Requests / Ledger Panel */}
      <div className="glass-card p-4 flex flex-col justify-between h-full border-[var(--glass-border)]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Settlements</span>
            </div>
            <Badge
              variant={pendingPaymentRequestsCount > 0 ? 'warning' : 'neutral'}
              size="sm"
            >
              {pendingPaymentRequestsCount > 0 ? `${pendingPaymentRequestsCount} Pending` : 'Up to Date'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Prepaid balance reconciliation and automated invoice billing queue status.
          </p>
          <div className="mt-3 space-y-1.5 text-[11px] font-mono text-[var(--text-tertiary)]">
            <div className="flex justify-between">
              <span>Clearing Status:</span>
              <span className="text-[var(--accent-emerald)] font-semibold">Normalized</span>
            </div>
            <div className="flex justify-between">
              <span>Dispute Queue:</span>
              <span className="text-[var(--text-primary)] font-semibold">0 Tickets</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab?.('financials')}
          className="mt-3 pt-2.5 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer w-full text-left"
        >
          <span>Financial Clearing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Live Notifications Panel */}
      <div className="glass-card p-4 flex flex-col justify-between h-full border-[var(--glass-border)]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--accent-violet-dim)] text-[var(--accent-violet)]">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Alert Stream</span>
            </div>
            <Badge
              variant={unreadNotificationsCount > 0 ? 'error' : 'neutral'}
              size="sm"
            >
              {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} Unread` : 'Clear'}
            </Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Real-time security telemetry, tenant provisioning triggers, and rate changes.
          </p>
          <div className="mt-3 space-y-1.5 text-[11px] font-mono text-[var(--text-tertiary)]">
            <div className="flex justify-between">
              <span>Security Audits:</span>
              <span className="text-[var(--accent-blue)] font-semibold">Live Monitored</span>
            </div>
            <div className="flex justify-between">
              <span>Rate Updates:</span>
              <span className="text-[var(--text-primary)] font-semibold">Synchronized</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab?.('audit')}
          className="mt-3 pt-2.5 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer w-full text-left"
        >
          <span>Audit Feed</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
