import React from 'react';
import {
  RefreshCw,
  Hash,
  Server,
  Users,
  Building2,
  TrendingUp,
  MessageSquare,
  Wallet,
  Clock,
  Briefcase,
  Inbox,
  Layers,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useDashboard } from '../../hooks/useDashboard';

interface AdminDashboardViewProps {
  onNavigateToTab: (tabId: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateToTab,
}) => {
  const { data, isLoading, isRefreshing, refresh } = useDashboard('7d');

  const metrics = data?.metrics;
  const charts = data?.charts;
  const numberInventory = charts?.numberInventory;

  const totalNumbers = metrics?.totalNumbers ?? numberInventory?.total ?? 0;
  const availableNumbers = metrics?.unassignedNumbers ?? 0;
  const allocatedNumbers = metrics?.assignedNumbers ?? 0;
  const testNumbers = 0;
  const expiredNumbers = 0;

  const availablePct = totalNumbers > 0 ? Math.round((availableNumbers / totalNumbers) * 100) : 0;
  const allocatedPct = totalNumbers > 0 ? Math.round((allocatedNumbers / totalNumbers) * 100) : 0;
  const testPct = 0;
  const expiredPct = 0;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const monthYearStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Dynamic Volume Chart Points (7 Days)
  const volumePoints = charts?.smsVolume || [];
  const maxVol = Math.max(...volumePoints.map((v) => v.total), 1);
  const svgPoints =
    volumePoints.length > 0
      ? volumePoints
          .map((v, i) => {
            const x = 50 + i * 100;
            const y = 140 - Math.round((v.total / maxVol) * 110);
            return `${x},${y}`;
          })
          .join(' ')
      : '50,140 150,140 250,140 350,140 450,140 550,140 650,140';

  const dayLabels =
    volumePoints.length > 0
      ? volumePoints.map((v) => v.label)
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const peakDayVolume =
    volumePoints.length > 0 ? Math.max(...volumePoints.map((v) => v.total)) : 0;
  const avgDayVolume =
    volumePoints.length > 0
      ? Math.round(
          volumePoints.reduce((acc, v) => acc + v.total, 0) / volumePoints.length
        )
      : 0;

  // Dynamic Earnings Chart Points (7 Days)
  const earningsPoints = charts?.earnings || [];
  const maxEarn = Math.max(...earningsPoints.map((e) => e.netProfit), 1);
  const earnSvgPoints =
    earningsPoints.length > 0
      ? earningsPoints
          .map((e, i) => {
            const x = 20 + i * 50;
            const y = 60 - Math.round((e.netProfit / maxEarn) * 45);
            return `${x},${y}`;
          })
          .join(' ')
      : '20,60 70,60 120,60 170,60 220,60 270,60';

  const periodTotalEarnings = earningsPoints.reduce((a, b) => a + (b.netProfit || 0), 0);
  const bestDayEarnings =
    earningsPoints.length > 0 ? Math.max(...earningsPoints.map((e) => e.netProfit || 0)) : 0;

  const totalMembers = (metrics?.totalManagers ?? 0) + (metrics?.totalAgents ?? 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Operations Overview
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Welcome back, admin. Live platform performance across SMS, numbers, and earnings
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              ADMIN
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
              {todayStr}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing || isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <button
            onClick={() => onNavigateToTab('numbers')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Manage Numbers</span>
          </button>
          <button
            onClick={() => onNavigateToTab('providers')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Providers</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Bright Colored KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Messages Today */}
        <div className="p-5 rounded-2xl bg-rose-600 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">
              {(metrics?.smsToday ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-bold tracking-wide">Messages Today</div>
            <div className="text-[11px] text-rose-200">Live inbound SMS</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 2: Member Earnings */}
        <div className="p-5 rounded-2xl bg-purple-700 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">
              ${(metrics?.totalEarnings ?? 0).toFixed(2)}
            </div>
            <div className="text-xs font-bold tracking-wide">Member Earnings</div>
            <div className="text-[11px] text-purple-200">Platform earnings recorded</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 3: Admin Profit */}
        <div className="p-5 rounded-2xl bg-sky-500 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">
              ${(metrics?.totalEarnings ?? 0).toFixed(4)}
            </div>
            <div className="text-xs font-bold tracking-wide">Admin Profit</div>
            <div className="text-[11px] text-sky-100">Net platform profit</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 4: 7 Day Traffic */}
        <div className="p-5 rounded-2xl bg-teal-500 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">
              {(metrics?.smsThisWeek ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-bold tracking-wide">7 Day Traffic</div>
            <div className="text-[11px] text-teal-100">Inbound SMS last 7 days</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Traffic (7 days) Chart + Key Account Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Traffic (7 days) */}
        <div className="lg:col-span-8 glass-card p-5 rounded-2xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Traffic (7 days)
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Inbound SMS volume by day
            </p>

            {/* Dynamic SVG Line Chart */}
            <div className="h-44 w-full mt-4 flex flex-col justify-between relative">
              <div className="flex-1 border-b border-[rgba(255,255,255,0.06)] relative flex items-center">
                <svg className="w-full h-full" viewBox="0 0 700 150" preserveAspectRatio="none">
                  <line
                    x1="0"
                    y1="140"
                    x2="700"
                    y2="140"
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 3"
                  />
                  <polyline
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                    points={svgPoints}
                  />
                  {(volumePoints.length > 0
                    ? volumePoints
                    : [0, 0, 0, 0, 0, 0, 0]
                  ).map((_, i) => {
                    const cx = 50 + i * 100;
                    const val = volumePoints[i]?.total || 0;
                    const cy = 140 - Math.round((val / maxVol) * 110);
                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="3.5"
                        fill="#14b8a6"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Day Labels */}
              <div className="flex justify-around text-[10px] font-mono text-[var(--text-tertiary)] pt-2">
                {dayLabels.map((lbl, idx) => (
                  <span key={idx}>{lbl}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom 4 Metrics */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[var(--glass-border)] text-center text-xs mt-3">
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                {metrics?.smsToday ?? 0}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Today's SMS</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                {metrics?.smsThisWeek ?? 0}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">This Week</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                {peakDayVolume}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Peak Day</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                {avgDayVolume}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Avg / Day</div>
            </div>
          </div>
        </div>

        {/* Key Account Metrics */}
        <div className="lg:col-span-4 glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {monthYearStr}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Key account metrics
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {/* New Members */}
            <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">New Members</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Registered accounts</div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                {totalMembers}
              </div>
            </div>

            {/* New Clients */}
            <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">New Clients</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Active clients</div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                {metrics?.totalClients ?? 0}
              </div>
            </div>

            {/* Pending Balance */}
            <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Platform Balance</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Total wallet balances</div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                ${(metrics?.platformBalance ?? 0).toFixed(2)}
              </div>
            </div>

            {/* Numbers Pool */}
            <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Numbers Pool</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    {availableNumbers.toLocaleString()} available
                  </div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                {totalNumbers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Section: Number Inventory, Platform Pulse, Earnings (7 days) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Number Inventory */}
        <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Number Inventory
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Pool distribution by status
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                <span>Available</span>
                <span className="font-mono text-blue-400">
                  {availableNumbers.toLocaleString()} • {availablePct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${availablePct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                <span>Allocated</span>
                <span className="font-mono text-sky-400">
                  {allocatedNumbers.toLocaleString()} • {allocatedPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${allocatedPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                <span>Test</span>
                <span className="font-mono text-amber-400">
                  {testNumbers} • {testPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${testPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                <span>Expired</span>
                <span className="font-mono text-rose-400">
                  {expiredNumbers} • {expiredPct}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${expiredPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Pulse */}
        <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Platform Pulse
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Core entities at a glance
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-center space-y-1">
              <Server className="w-5 h-5 mx-auto text-teal-400 mb-1" />
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                {metrics?.totalProviders ?? 0}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">Providers</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-center space-y-1">
              <Layers className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                {metrics?.totalRanges ?? 0}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">Ranges</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-center space-y-1">
              <Users className="w-5 h-5 mx-auto text-sky-400 mb-1" />
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                {totalMembers}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">Members</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-center space-y-1">
              <Building2 className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                {metrics?.totalClients ?? 0}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">Clients</div>
            </div>
          </div>
        </div>

        {/* Earnings (7 days) */}
        <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Earnings (7 days)
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Member earnings trend
            </p>

            <div className="h-32 w-full mt-4 flex items-center justify-center border-b border-[rgba(255,255,255,0.06)]">
              <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  points={earnSvgPoints}
                />
                {(earningsPoints.length > 0
                  ? earningsPoints
                  : [0, 0, 0, 0, 0, 0]
                ).map((_, i) => {
                  const cx = 20 + i * 50;
                  const val = earningsPoints[i]?.netProfit || 0;
                  const cy = 60 - Math.round((val / maxEarn) * 45);
                  return <circle key={i} cx={cx} cy={cy} r="3" fill="#10b981" />;
                })}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[var(--glass-border)] text-center text-xs">
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                ${periodTotalEarnings.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Period Total</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">
                ${bestDayEarnings.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Best Day</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Recent SMS and Top Members Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent SMS */}
        <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Recent SMS
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Latest inbound messages
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-700/60 text-slate-300">
              {metrics?.smsToday ?? 0} today
            </span>
          </div>
          <div className="py-12 text-center text-xs text-[var(--text-tertiary)] space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-600" />
            <p>No recent messages yet.</p>
          </div>
        </div>

        {/* Top Members Today */}
        <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Top Members Today
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Highest SMS volume
            </p>
          </div>
          <div className="py-12 text-center text-xs text-[var(--text-tertiary)] space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600" />
            <p>No member traffic today yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
