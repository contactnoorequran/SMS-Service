import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/* ─── Mock data helpers ─── */
const today = new Date();
const fmt = (n: number, prefix = '') =>
  n === 0 ? `${prefix}0.00` : `${prefix}${n.toFixed(2)}`;

function buildLast15Days() {
  const days: { label: string; sms: number; earn: number }[] = [];
  for (let i = 14; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      sms: Math.floor(Math.random() * 0),   // all zero for fresh agent
      earn: 0,
    });
  }
  return days;
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
  <div className="glass-card p-4 flex flex-col gap-3 relative overflow-hidden">
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

/* ─── Volume Chart (last 15 days) ─── */
const VolumeChart: React.FC<{ data: { label: string; sms: number; earn: number }[] }> = ({ data }) => {
  const maxSms = Math.max(...data.map((d) => d.sms), 1);
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Volume · last 15 days</h3>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
              <strong className="text-[var(--text-primary)]">{data.reduce((a, b) => a + b.sms, 0).toLocaleString()}</strong> SMS received
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
              <strong className="text-[var(--text-primary)]">${fmt(data.reduce((a, b) => a + b.earn, 0))}</strong> Earnings
            </span>
          </div>
        </div>
        <BarChart3 className="w-5 h-5 text-[var(--text-tertiary)]" />
      </div>
      {/* Bars */}
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const pct = maxSms > 0 ? (d.sms / maxSms) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                title={`${d.label}: ${d.sms} SMS`}
                className="w-full rounded-t-sm transition-all duration-300 cursor-pointer"
                style={{
                  height: `${Math.max(pct, 4)}%`,
                  background: pct > 0
                    ? 'linear-gradient(to top, var(--accent-blue), var(--accent-violet))'
                    : 'var(--glass-border)',
                }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels — every 3rd */}
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[8px] text-[var(--text-tertiary)] font-mono truncate">
            {i % 3 === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Top Clients / Ranges empty widgets ─── */
const EmptyWidget: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="glass-card p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">30d</span>
    </div>
    <div className="py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center mx-auto mb-2">
        <BarChart3 className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
      <p className="text-xs text-[var(--text-tertiary)] italic">{message}</p>
    </div>
  </div>
);

/* ─── Main Export ─── */
interface AgentDashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

export const AgentDashboardView: React.FC<AgentDashboardViewProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const [chartData] = useState(buildLast15Days);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      setLastRefresh(new Date());
      setSpinning(false);
    }, 800);
  };

  // KPI cards
  const topCards = [
    { label: 'SMS today', value: '0', sub: 'Received today', icon: <MessageSquare className="w-4 h-4 text-[var(--accent-blue)]" />, accent: 'var(--accent-blue)' },
    { label: 'SMS this week', value: '0', sub: 'Received since Monday', icon: <Calendar className="w-4 h-4 text-[var(--accent-violet)]" />, accent: 'var(--accent-violet)' },
    { label: 'Earnings today', value: '$0.00', sub: 'Earned today', icon: <DollarSign className="w-4 h-4 text-[var(--accent-emerald)]" />, accent: 'var(--accent-emerald)' },
    { label: 'Earnings this month', value: '$0.00', sub: 'Earned since the 1st', icon: <TrendingUp className="w-4 h-4 text-[var(--accent-amber)]" />, accent: 'var(--accent-amber)' },
  ];

  const sideStats = [
    { label: 'SMS Yesterday', value: '0', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { label: 'Earnings this week', value: '$0.00', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { label: 'Available balance', value: '$0.00', icon: <Wallet className="w-3.5 h-3.5" /> },
    { label: 'Maturing', value: '$0.00', icon: <Clock className="w-3.5 h-3.5" /> },
    { label: 'My clients', value: '0', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="glass-card p-5 border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(59,130,246,0.05)] via-transparent to-[rgba(139,92,246,0.04)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse" />
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">Agent Portal · Live</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Welcome, {
              (user?.firstName && user?.lastName)
                ? `${user.firstName} ${user.lastName}`
                : user?.firstName || user?.email?.split('@')[0] || 'Agent'
            } 👋
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Here's your SMS performance overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-refresh-agent-dashboard"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
              {spinning ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        {/* Last refresh */}
        <div className="relative mt-3 pt-3 border-t border-[var(--glass-border)] flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-mono">
          <Zap className="w-3 h-3 text-[var(--accent-emerald)]" />
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ── KPI Cards + Side Stats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Main KPI cards (2×2 grid in 3/4 width) */}
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topCards.map((c) => (
            <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} sub={c.sub} accent={c.accent} />
          ))}
        </div>

        {/* Side stats panel */}
        <div className="glass-card p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Finance & Account
          </h3>
          {sideStats.map((s) => (
            <SideStat key={s.label} label={s.label} value={s.value} icon={s.icon} />
          ))}
        </div>
      </div>

      {/* ── Volume Chart ── */}
      <VolumeChart data={chartData} />

      {/* ── Bottom Widgets: Top Clients + Top Ranges ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmptyWidget
          title="Top clients · 30d"
          message="no client traffic in last 30 days"
        />
        <EmptyWidget
          title="Top ranges · 30d"
          message="no range traffic in last 30 days"
        />
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
