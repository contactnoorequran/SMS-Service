import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Wallet,
  Clock,
  BarChart3,
  RefreshCw,
  Zap,
  ArrowUpRight,
  Inbox,
} from 'lucide-react';
import { AppIcon } from '../ui/AppIcon';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

interface AgentStats {
  smsToday: number;
  smsThisWeek: number;
  smsYesterday: number;
  earningsToday: number;
  earningsThisMonth: number;
  earningsThisWeek: number;
  availableBalance: number;
  maturingBalance: number;
  clientsCount: number;
}

interface VolumeDay {
  label: string;
  sms: number;
}

/* ─── Sub-components ─── */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, accent = 'var(--accent-blue)' }) => (
  <div className="agent-kpi glass-card p-4 flex flex-col gap-3 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(59,130,246,0.04)] to-transparent pointer-events-none" />
    <div className="relative flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</span>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}>
        {icon}
      </span>
    </div>
    <div className="relative">
      <div className="text-2xl font-bold text-[var(--text-primary)] font-mono tracking-tight">{value}</div>
      {sub && <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{sub}</div>}
    </div>
  </div>
);

interface SideStatProps { label: string; value: string; icon: React.ReactNode }
const SideStat: React.FC<SideStatProps> = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-[var(--glass-border)] last:border-0">
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-tertiary)]">{icon}</span>
      <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
    </div>
    <span className="text-[11px] font-semibold font-mono text-[var(--text-primary)]">{value}</span>
  </div>
);

/* ─── Volume Chart (last 15 days from real data) ─── */
const VolumeChart: React.FC<{ data: VolumeDay[] }> = ({ data }) => {
  const maxSms = Math.max(...data.map((d) => d.sms), 1);
  const totalSms = data.reduce((a, b) => a + b.sms, 0);
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Volume · last 15 days</h3>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
              <strong className="text-[var(--text-primary)]">{totalSms.toLocaleString()}</strong> SMS received
            </span>
          </div>
        </div>
        <BarChart3 className="w-5 h-5 text-[var(--text-tertiary)]" />
      </div>
      {totalSms === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[var(--text-tertiary)]">
          <Inbox className="w-6 h-6 opacity-40 mb-1" />
          <p className="text-[11px]">No message traffic in the last 15 days</p>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-1 h-48 border-b border-[var(--glass-border)]">
            {data.map((d, i) => {
              const pct = maxSms > 0 ? (d.sms / maxSms) * 100 : 0;
              return (
                <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group">
                  <div
                    title={`${d.label}: ${d.sms} SMS`}
                    className="w-full rounded-t-sm transition-all duration-300 cursor-pointer"
                    style={{
                      height: `${pct}%`,
                      background: pct > 0
                        ? 'linear-gradient(to top, var(--accent-blue), var(--accent-violet))'
                        : 'var(--glass-border)',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1">
            {data.map((d, i) => (
              <div key={i} className="flex-1 text-center text-[8px] text-[var(--text-tertiary)] font-mono truncate">
                {i % 3 === 0 ? d.label : ''}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Main Export ─── */
interface AgentDashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

const fmt = (n: number, prefix = '') =>
  n === 0 ? `${prefix}0.00` : `${prefix}${n.toFixed(2)}`;

export const AgentDashboardView: React.FC<AgentDashboardViewProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [chartData, setChartData] = useState<VolumeDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [spinning, setSpinning] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch agent statistics from dashboard or dedicated agent stats endpoint
      const dashStats = await apiClient.getDashboardStats();
      const agentId = (user as any)?.agentId || user?.id;

      // Build last 15 days chart data from real SMS volume data
      const today = new Date();
      const days: VolumeDay[] = [];
      const smsVolumeData = dashStats?.charts?.smsVolume || [];

      for (let i = 14; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        // Try to match a real data point
        const match = smsVolumeData.find((pt: any) =>
          pt.label === label || pt.date?.startsWith(d.toISOString().split('T')[0])
        );
        days.push({ label, sms: match?.total || match?.inbound || 0 });
      }
      setChartData(days);

      setStats({
        smsToday: dashStats?.metrics?.smsToday || 0,
        smsThisWeek: dashStats?.metrics?.smsThisWeek || 0,
        smsYesterday: 0,
        earningsToday: 0,
        earningsThisMonth: dashStats?.metrics?.totalEarnings || 0,
        earningsThisWeek: 0,
        availableBalance: dashStats?.metrics?.platformBalance || 0,
        maturingBalance: 0,
        clientsCount: dashStats?.metrics?.totalClients || 0,
      });
    } catch {
      // On error set all zeros — do not invent data
      setStats({
        smsToday: 0, smsThisWeek: 0, smsYesterday: 0,
        earningsToday: 0, earningsThisMonth: 0, earningsThisWeek: 0,
        availableBalance: 0, maturingBalance: 0, clientsCount: 0,
      });
      // Build empty 15-day chart
      const today = new Date();
      const days: VolumeDay[] = [];
      for (let i = 14; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, sms: 0 });
      }
      setChartData(days);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleRefresh = () => {
    setSpinning(true);
    loadStats().finally(() => {
      setLastRefresh(new Date());
      setSpinning(false);
    });
  };

  const s = stats;

  const topCards = [
    {
      label: 'SMS today',
      value: isLoading ? '…' : (s?.smsToday ?? 0).toLocaleString(),
      sub: 'Received today',
      icon: <AppIcon name="sms-routing" size="sm" className="text-[var(--accent-blue)]" />,
      accent: 'var(--accent-blue)',
    },
    {
      label: 'SMS this week',
      value: isLoading ? '…' : (s?.smsThisWeek ?? 0).toLocaleString(),
      sub: 'Received since Monday',
      icon: <Calendar className="w-4 h-4 text-[var(--accent-violet)]" />,
      accent: 'var(--accent-violet)',
    },
    {
      label: 'Earnings today',
      value: isLoading ? '…' : `$${fmt(s?.earningsToday ?? 0)}`,
      sub: 'Earned today',
      icon: <AppIcon name="agent-commission" size="sm" className="text-[var(--accent-emerald)]" />,
      accent: 'var(--accent-emerald)',
    },
    {
      label: 'Earnings this month',
      value: isLoading ? '…' : `$${fmt(s?.earningsThisMonth ?? 0)}`,
      sub: 'Earned since the 1st',
      icon: <AppIcon name="client-revenue" size="sm" className="text-[var(--accent-amber)]" />,
      accent: 'var(--accent-amber)',
    },
  ];

  const sideStats = [
    { label: 'SMS Yesterday', value: isLoading ? '…' : (s?.smsYesterday ?? 0).toLocaleString(), icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { label: 'Earnings this week', value: isLoading ? '…' : `$${fmt(s?.earningsThisWeek ?? 0)}`, icon: <DollarSign className="w-3.5 h-3.5" /> },
    { label: 'Available balance', value: isLoading ? '…' : `$${fmt(s?.availableBalance ?? 0)}`, icon: <Wallet className="w-3.5 h-3.5" /> },
    { label: 'Maturing', value: isLoading ? '…' : `$${fmt(s?.maturingBalance ?? 0)}`, icon: <Clock className="w-3.5 h-3.5" /> },
    { label: 'My clients', value: isLoading ? '…' : (s?.clientsCount ?? 0).toLocaleString(), icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="reference-page space-y-5">
      {/* ── Page header ── */}
      <div className="reference-heading glass-card p-5 border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.05)] via-transparent to-[rgba(139,92,246,0.04)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">WORLD SMS SERVICE · Agent Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-page-title">
              Dashboard
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-body">
              Here's your SMS performance overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-refresh-agent-dashboard"
              onClick={handleRefresh}
              disabled={isLoading || spinning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || spinning) ? 'animate-spin' : ''}`} />
              {(isLoading || spinning) ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="relative mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono">
          <Zap className="w-3 h-3 text-[var(--accent-emerald)]" />
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ── KPI Cards + Side Stats ── */}
      <div className="space-y-4">
        <div className="agent-kpis">
          {topCards.map((c) => (
            <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} sub={c.sub} accent={c.accent} />
          ))}
        </div>

        <div className="agent-volume-row">
          <VolumeChart data={chartData} />
        <div className="glass-card p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Finance & Account
          </h3>
          {sideStats.map((s) => (
            <SideStat key={s.label} label={s.label} value={s.value} icon={s.icon} />
          ))}
        </div>
      </div>

      </div>

      {/* ── Quick Nav shortcuts ── */}
      <div className="glass-card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'SMS Ranges', tab: 'sms-ranges', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
            { label: 'My Numbers', tab: 'my-numbers', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
            { label: 'Bulk Add', tab: 'bulk-add', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
            { label: 'SMS Test Panel', tab: 'sms-test-panel', icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
          ].map((q) => (
            <button
              key={q.tab}
              id={`btn-quick-nav-${q.tab}`}
              onClick={() => onNavigateToTab(q.tab)}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-hover)] cursor-pointer transition-all"
            >
              <span>{q.label}</span>
              {q.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
