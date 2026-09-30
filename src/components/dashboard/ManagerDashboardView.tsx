/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Shield,
  ArrowUpRight,
  RefreshCw,
  Send,
  Building2,
  DollarSign,
  Hash,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ManagerDashboardViewProps {
  onNavigateToTab: (tabId: string) => void;
}

interface PendingApproval {
  id: string;
  type: 'DEPOSIT' | 'PAYOUT' | 'RANGE_QUOTA';
  requester: string;
  role: 'CLIENT' | 'AGENT';
  amountOrUnits: string;
  methodOrRange: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_APPROVALS: PendingApproval[] = [
  {
    id: 'REQ-9102',
    type: 'DEPOSIT',
    requester: 'Acme Global Telematics',
    role: 'CLIENT',
    amountOrUnits: '$500.00 USD',
    methodOrRange: 'Bank Wire (Ref #TX-88219)',
    timestamp: '12 mins ago',
    status: 'PENDING',
  },
  {
    id: 'REQ-9103',
    type: 'PAYOUT',
    requester: 'Agent Alex Rivera',
    role: 'AGENT',
    amountOrUnits: '$1,250.00 USD',
    methodOrRange: 'USDT TRC20 Wallet',
    timestamp: '38 mins ago',
    status: 'PENDING',
  },
  {
    id: 'REQ-9104',
    type: 'RANGE_QUOTA',
    requester: 'Agent Sarah Chen',
    role: 'AGENT',
    amountOrUnits: '5,000 Numbers',
    methodOrRange: 'United Kingdom +44 7911 Prefix',
    timestamp: '1 hour ago',
    status: 'PENDING',
  },
];

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({ onNavigateToTab }) => {
  const [approvals, setApprovals] = useState<PendingApproval[]>(INITIAL_APPROVALS);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
    const item = approvals.find((a) => a.id === id);
    const verb = action === 'APPROVED' ? 'Approved' : 'Rejected';
    setActionNotice(`${verb} request ${id} (${item?.requester})`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 glass-card border-[rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(16,185,129,0.06)] via-transparent to-[rgba(59,130,246,0.04)] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Manager Operations Portal
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                WORLD SMS SERVICE Team Management
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-page-title">
              Manager Overview
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-2xl leading-relaxed font-body">
              Oversight of assigned agent rosters, client allocations, prefix quotas, and financial approval queues.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab('manager-approvals')}
              className="gap-2 text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              <span>Full Approvals ({pendingCount})</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateToTab('managers-team')}
              className="gap-2 text-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Team</span>
            </Button>
          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 p-2.5 bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)] rounded-xl text-xs flex items-center justify-between animate-fade-in font-medium">
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-[var(--accent-emerald)] hover:opacity-75 text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Assigned Agents</span>
            <Users className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">4</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--accent-emerald)]">
              <TrendingUp className="w-3 h-3" />
              <span>100% active</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Managed Clients</span>
            <Building2 className="w-4 h-4 text-[var(--accent-emerald)]" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">18</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-tertiary)]">
              <span>All KYC Verified</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Allocated Numbers</span>
            <Hash className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">14,250</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--text-tertiary)]">
              <span>Across 6 Prefixes</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Monthly SMS Volume</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">342,890</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--accent-emerald)]">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% MoM</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Pending Approvals */}
        <div className="glass-card p-4 rounded-xl border border-[rgba(234,179,8,0.25)] bg-[rgba(234,179,8,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--text-tertiary)] text-xs">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Requires attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Urgent Approvals Quick-Review Panel */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Priority Approvals Queue</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Deposits, agent commission payouts, and range quota extensions awaiting your review
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('manager-approvals')}
            className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>View All Approvals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {approvals.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
            No pending requests in your queue.
          </div>
        ) : (
          <div className="divide-y divide-[var(--glass-border)] border border-[var(--glass-border)] rounded-xl overflow-hidden bg-[rgba(0,0,0,0.1)]">
            {approvals.map((req) => (
              <div
                key={req.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--glass-bg)] transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      req.type === 'DEPOSIT'
                        ? 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]'
                        : req.type === 'PAYOUT'
                        ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
                        : 'bg-purple-500/10 text-purple-400'
                    }`}
                  >
                    {req.type === 'DEPOSIT' ? '$' : req.type === 'PAYOUT' ? 'P' : 'R'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                        {req.id}
                      </span>
                      <Badge
                        variant={
                          req.type === 'DEPOSIT'
                            ? 'success'
                            : req.type === 'PAYOUT'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {req.type}
                      </Badge>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        {req.timestamp}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-primary)] font-medium mt-1">
                      {req.requester} &bull;{' '}
                      <span className="text-[var(--text-secondary)] font-normal">{req.role}</span>
                    </div>

                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {req.amountOrUnits}
                      </span>{' '}
                      via {req.methodOrRange}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleAction(req.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)] hover:text-white transition-all flex items-center gap-1.5 border border-[rgba(16,185,129,0.3)] cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] hover:bg-[var(--accent-rose)] hover:text-white transition-all flex items-center gap-1.5 border border-[rgba(244,63,94,0.3)] cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <Badge variant={req.status === 'APPROVED' ? 'success' : 'error'} size="sm">
                      {req.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Team Performance & Quota Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Roster Card */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>Assigned Agent Roster</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('managers-team')}
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              Team Details
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'AAbuzar (Primary Agent)', email: 'agent@smshub.local', clients: 8, quotaUsage: 84, status: 'Active' },
              { name: 'Alex Rivera', email: 'alex@smshub.local', clients: 4, quotaUsage: 62, status: 'Active' },
              { name: 'Sarah Chen', email: 'sarah@smshub.local', clients: 4, quotaUsage: 91, status: 'Active' },
              { name: 'Marcus Vance', email: 'marcus@smshub.local', clients: 2, quotaUsage: 35, status: 'Idle' },
            ].map((agent, i) => (
              <div key={i} className="p-3 bg-[rgba(0,0,0,0.12)] border border-[var(--glass-border)] rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{agent.name}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)] font-mono truncate">{agent.email}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    Managing {agent.clients} clients &bull; Quota usage: <span className="font-semibold">{agent.quotaUsage}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-44 bg-[var(--glass-bg)] h-1.5 rounded-full overflow-hidden mt-1.5 border border-[var(--glass-border)]">
                    <div
                      className={`h-full rounded-full ${
                        agent.quotaUsage > 85 ? 'bg-amber-400' : 'bg-[var(--accent-blue)]'
                      }`}
                      style={{ width: `${agent.quotaUsage}%` }}
                    />
                  </div>
                </div>

                <Badge variant={agent.status === 'Active' ? 'success' : 'neutral'} size="sm">
                  {agent.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations & Prefixes */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Assigned Prefix Pools</span>
            </h3>

            <div className="space-y-2.5">
              {[
                { country: 'United Kingdom', flag: '🇬🇧', prefix: '+44 7911', allocated: 5000, active: 4620 },
                { country: 'United States', flag: '🇺🇸', prefix: '+1 202', allocated: 4000, active: 3810 },
                { country: 'Germany', flag: '🇩🇪', prefix: '+49 151', allocated: 3000, active: 2490 },
                { country: 'Sweden', flag: '🇸🇪', prefix: '+46 70', allocated: 2250, active: 1890 },
              ].map((pool, idx) => (
                <div key={idx} className="p-3 bg-[rgba(0,0,0,0.12)] border border-[var(--glass-border)] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{pool.flag}</span>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{pool.country}</div>
                      <div className="font-mono text-[11px] text-[var(--accent-blue)]">{pool.prefix}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-[var(--text-primary)]">
                      {pool.active.toLocaleString()} / {pool.allocated.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">
                      {Math.round((pool.active / pool.allocated) * 100)}% utilization
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Want to allocate more ranges to your team?</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab('sms-ranges')}
              className="text-xs"
            >
              Browse Ranges
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
