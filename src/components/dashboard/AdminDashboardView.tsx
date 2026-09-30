/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  RefreshCw,
  Hash,
  Radio,
  Server,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Wallet,
  Clock,
  Briefcase,
  AlertCircle,
  Inbox,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface AdminDashboardViewProps {
  onNavigateToTab: (tabId: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateToTab,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const todayStr = 'Wed, Sep 30';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header matching Screenshot 1 */}
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
            onClick={handleRefresh}
            isLoading={isRefreshing}
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

      {/* 2. Top 4 Bright Colored KPI Cards matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Messages Today (Coral / Red) */}
        <div className="p-5 rounded-2xl bg-rose-600 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">0</div>
            <div className="text-xs font-bold tracking-wide">Messages Today</div>
            <div className="text-[11px] text-rose-200">+0% vs yesterday</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 2: Member Earnings (Purple) */}
        <div className="p-5 rounded-2xl bg-purple-700 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">$0.00</div>
            <div className="text-xs font-bold tracking-wide">Member Earnings</div>
            <div className="text-[11px] text-purple-200">Today payouts</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 3: Admin Profit (Sky / Blue) */}
        <div className="p-5 rounded-2xl bg-sky-500 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">$0.0000</div>
            <div className="text-xs font-bold tracking-wide">Admin Profit</div>
            <div className="text-[11px] text-sky-100">Net platform profit today</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 4: 7 Day Traffic (Teal) */}
        <div className="p-5 rounded-2xl bg-teal-500 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-3xl font-black font-mono">0</div>
            <div className="text-xs font-bold tracking-wide">7 Day Traffic</div>
            <div className="text-[11px] text-teal-100">Inbound SMS last 7 days</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Traffic (7 days) Chart + September 2026 Metrics */}
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

            {/* Simple SVG Line Chart */}
            <div className="h-44 w-full mt-4 flex flex-col justify-between relative">
              <div className="flex-1 border-b border-[rgba(255,255,255,0.06)] relative flex items-center">
                <svg className="w-full h-full" viewBox="0 0 700 150" preserveAspectRatio="none">
                  <line x1="0" y1="140" x2="700" y2="140" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                  <polyline
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                    points="50,140 150,140 250,140 350,140 450,140 550,140 650,140"
                  />
                  {[50, 150, 250, 350, 450, 550, 650].map((cx, i) => (
                    <circle key={i} cx={cx} cy="140" r="3.5" fill="#14b8a6" />
                  ))}
                </svg>
              </div>

              {/* Day Labels */}
              <div className="flex justify-around text-[10px] font-mono text-[var(--text-tertiary)] pt-2">
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
              </div>
            </div>
          </div>

          {/* Bottom 4 Metrics */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[var(--glass-border)] text-center text-xs mt-3">
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">0</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Today's SMS</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">0</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">This Week</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">0</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Peak Day</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">0</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Avg / Day</div>
            </div>
          </div>
        </div>

        {/* September 2026 Key Account Metrics */}
        <div className="lg:col-span-4 glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              September 2026
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
                  <div className="text-[10px] text-[var(--text-tertiary)]">Registered this month</div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">2</div>
            </div>

            {/* New Clients */}
            <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">New Clients</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Added this month</div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">0</div>
            </div>

            {/* Pending Balance */}
            <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Pending Balance</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Total members pending</div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">$0.00</div>
            </div>

            {/* Numbers Pool */}
            <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Numbers Pool</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">10,591 available</div>
                </div>
              </div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">11,002</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Section matching Screenshot 2: Number Inventory, Platform Pulse, Earnings (7 days) */}
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
                <span className="font-mono text-blue-400">10,591 • 96%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '96%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                <span>Allocated</span>
                <span className="font-mono text-sky-400">409 • 4%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: '4%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                <span>Test</span>
                <span className="font-mono text-amber-400">2 • 0%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '1%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1 text-[var(--text-primary)]">
                <span>Expired</span>
                <span className="font-mono text-rose-400">0 • 0%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[rgba(0,0,0,0.3)] overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '0%' }} />
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
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">1</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Providers</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-center space-y-1">
              <Layers className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">2</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Ranges</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-center space-y-1">
              <Users className="w-5 h-5 mx-auto text-sky-400 mb-1" />
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">2</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Members</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-center space-y-1">
              <Building2 className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
              <div className="text-xl font-bold font-mono text-[var(--text-primary)]">0</div>
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
                  points="20,60 70,60 120,60 170,60 220,60 270,60"
                />
                {[20, 70, 120, 170, 220, 270].map((cx, i) => (
                  <circle key={i} cx={cx} cy="60" r="3" fill="#10b981" />
                ))}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[var(--glass-border)] text-center text-xs">
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">$0.00</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Period Total</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[var(--text-primary)]">$0.00</div>
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
              0 latest
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
