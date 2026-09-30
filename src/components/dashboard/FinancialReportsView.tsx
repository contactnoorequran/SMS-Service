/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Download,
  Calendar,
  Building2,
  Mail,
  Inbox,
  Wallet,
  Clock,
  Search,
  AtSign,
  TrendingUp,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { apiClient } from '../../services/api';

interface MemberFinancialItem {
  id: string;
  userName: string;
  email: string;
  availableBalance: number;
  pendingBalance: number;
  paidSms: number;
  unpaidSms: number;
  earnings: number;
  adminProfit: number;
}

export const FinancialReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Members' | 'Wholesale'>('Members');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-30');
  const [senderIdSearch, setSenderIdSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Members list (populated with the system's members / agents)
  const [members, setMembers] = useState<MemberFinancialItem[]>([
    {
      id: 'm1',
      userName: 'Zubair',
      email: 'zubair@sms.service',
      availableBalance: 0,
      pendingBalance: 0,
      paidSms: 0,
      unpaidSms: 0,
      earnings: 0,
      adminProfit: 0,
    },
    {
      id: 'm2',
      userName: 'Muddasir',
      email: 'muddasir@sms.service',
      availableBalance: 0,
      pendingBalance: 0,
      paidSms: 0,
      unpaidSms: 0,
      earnings: 0,
      adminProfit: 0,
    },
    {
      id: 'm3',
      userName: 'Hamza',
      email: 'hamza@sms.service',
      availableBalance: 0,
      pendingBalance: 0,
      paidSms: 0,
      unpaidSms: 0,
      earnings: 0,
      adminProfit: 0,
    },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  };

  const handleThisMonth = () => {
    setFromDate('2026-09-01');
    setToDate('2026-09-30');
  };

  // Filter members by memberSearch
  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return m.userName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* 1. Header matching Screenshot 4 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--text-primary,#f8fafc)] tracking-tight">
            Financial Reports
          </h1>
          <p className="text-xs text-[var(--text-secondary,#94a3b8)]">
            Track member balances, SMS earnings, and platform profit across your selected date range.
          </p>
          <div className="pt-0.5">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              ADMIN
            </span>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => alert('Exporting CSV...')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/90 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => alert('Exporting Excel...')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/80 hover:bg-slate-600 text-[var(--text-secondary,#94a3b8)] hover:text-white flex items-center gap-1.5 transition-colors border border-[var(--glass-border,#334155)]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary,#94a3b8)] border border-[var(--glass-border,#334155)] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs: Members, Wholesale */}
      <div className="flex items-center gap-1 border-b border-[var(--glass-border,#334155)] pb-1">
        <button
          onClick={() => setActiveTab('Members')}
          className={`px-4 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'Members'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-[var(--text-tertiary,#64748b)] hover:text-[var(--text-secondary,#94a3b8)]'
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab('Wholesale')}
          className={`px-4 py-2 text-xs font-semibold transition-all relative ${
            activeTab === 'Wholesale'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-[var(--text-tertiary,#64748b)] hover:text-[var(--text-secondary,#94a3b8)]'
          }`}
        >
          Wholesale
        </button>
      </div>

      {/* 2. Top 5 KPI Cards matching Screenshot 4 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* ADMIN NET PROFIT */}
        <div className="glass-card p-3.5 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              ADMIN NET PROFIT
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              $0.00
            </div>
            <div className="text-[10px] text-[var(--text-secondary,#94a3b8)] mt-0.5 truncate">
              Platform profit for selected period
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* PAID SMS */}
        <div className="glass-card p-3.5 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              PAID SMS
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              0
            </div>
            <div className="text-[10px] text-[var(--text-secondary,#94a3b8)] mt-0.5 truncate">
              Counted messages in period
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
        </div>

        {/* UNPAID SMS */}
        <div className="glass-card p-3.5 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              UNPAID SMS
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              0
            </div>
            <div className="text-[10px] text-[var(--text-secondary,#94a3b8)] mt-0.5 truncate">
              Over daily limit in period
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
        </div>

        {/* AVAILABLE BALANCE */}
        <div className="glass-card p-3.5 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              AVAILABLE BALANCE
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              $0.00
            </div>
            <div className="text-[10px] text-[var(--text-secondary,#94a3b8)] mt-0.5 truncate">
              All members — withdrawable funds
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        {/* PENDING BALANCE */}
        <div className="glass-card p-3.5 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[9px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              PENDING BALANCE
            </div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              $0.00
            </div>
            <div className="text-[10px] text-[var(--text-secondary,#94a3b8)] mt-0.5 truncate">
              All members — awaiting clearance
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Section: Report Period matching Screenshot 4 */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border,#334155)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary,#f8fafc)]">
              Report Period
            </h2>
            <p className="text-xs text-[var(--text-secondary,#94a3b8)] mt-0.5">
              Select a date range and optional Sender ID to refresh KPI cards and member summary
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Sep 01, 2026 – Sep 30, 2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-end">
          {/* From Date */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
            />
          </div>

          {/* Search by Sender ID */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
              Search by Sender ID
            </label>
            <div className="relative">
              <AtSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary,#64748b)]" />
              <input
                type="text"
                placeholder="@ e.g. WhatsApp or Facebook"
                value={senderIdSearch}
                onChange={(e) => setSenderIdSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] placeholder:text-[var(--text-tertiary,#64748b)] focus:outline-none focus:border-teal-500"
              />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary,#64748b)] mt-1">
              Leave empty to include all apps
            </p>
          </div>

          {/* Member Search */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
              Member search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary,#64748b)]" />
              <input
                type="text"
                placeholder="Member search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] placeholder:text-[var(--text-tertiary,#64748b)] focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom controls: Rows dropdown, Update Report button, This Month button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-secondary,#94a3b8)] font-semibold">
              Rows
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(e.target.value)}
              className="px-2.5 py-1.5 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-lg text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Update Report
            </button>
            <button
              onClick={handleThisMonth}
              className="px-3.5 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary,#94a3b8)] border border-[var(--glass-border,#334155)] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>This Month</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Section: Members Financial Summary Table matching Screenshot 4 */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border,#334155)] overflow-hidden">
        <div className="p-5 border-b border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary,#f8fafc)]">
              Members Financial Summary
            </h2>
            <p className="text-xs text-[var(--text-secondary,#94a3b8)] mt-0.5">
              Per-member balances and period earnings breakdown
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
            Live data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[rgba(0,0,0,0.2)] text-[var(--text-secondary,#94a3b8)] border-b border-[var(--glass-border,#334155)] uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">USER NAME</th>
                <th className="py-3 px-4">EMAIL</th>
                <th className="py-3 px-4">AVAILABLE BALANCE</th>
                <th className="py-3 px-4">PENDING BALANCE</th>
                <th className="py-3 px-4 text-center">PAID SMS</th>
                <th className="py-3 px-4 text-center">UNPAID SMS</th>
                <th className="py-3 px-4">EARNINGS</th>
                <th className="py-3 px-4">ADMIN PROFIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border,#334155)]">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[var(--text-primary,#f8fafc)]">
                    {m.userName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary,#94a3b8)]">
                    {m.email}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[var(--text-primary,#f8fafc)] font-semibold">
                    ${m.availableBalance.toFixed(4)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[var(--text-secondary,#94a3b8)]">
                    ${m.pendingBalance.toFixed(4)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center font-semibold text-teal-400">
                    {m.paidSms}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center text-[var(--text-tertiary,#64748b)]">
                    {m.unpaidSms}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[var(--text-primary,#f8fafc)] font-semibold">
                    ${m.earnings.toFixed(4)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                    ${m.adminProfit.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
