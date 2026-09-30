/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  Zap,
  Layers,
  Server,
  Hash,
  Users,
  Edit2,
  MoreVertical,
  X,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface RangeItem {
  id: string;
  name: string;
  totalNumbers: number;
  provider: string;
  dailyLimit: number;
  status: 'Active' | 'Inactive';
  membersCount: number;
}

export const RangesManagementView: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mock ranges matching Screenshot 5
  const [ranges, setRanges] = useState<RangeItem[]>([
    {
      id: 'r1',
      name: 'test-for-test',
      totalNumbers: 10000,
      provider: 'Alaa0',
      dailyLimit: 10,
      status: 'Active',
      membersCount: 408,
    },
    {
      id: 'r2',
      name: 'Alaa Test',
      totalNumbers: 1002,
      provider: '—',
      dailyLimit: 1000000,
      status: 'Active',
      membersCount: 1,
    },
  ]);

  // Modal State
  const [selectedProvider, setSelectedProvider] = useState('Alaa0');
  const [rangeName, setRangeName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [providerPayout, setProviderPayout] = useState('0.0000');
  const [memberPayout, setMemberPayout] = useState('0.0000');
  const [payoutCycle, setPayoutCycle] = useState('Weekly');
  const [dailySmsLimit, setDailySmsLimit] = useState('5');
  const [isActiveForMembers, setIsActiveForMembers] = useState(true);
  const [internalNotes, setInternalNotes] = useState('');

  const providerPayoutNum = parseFloat(providerPayout) || 0;
  const memberPayoutNum = parseFloat(memberPayout) || 0;
  const platformNetProfit = Math.max(0, providerPayoutNum - memberPayoutNum);

  const handleCreateRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeName.trim()) return;

    const newRange: RangeItem = {
      id: `r-${Date.now()}`,
      name: rangeName.trim(),
      totalNumbers: 0,
      provider: selectedProvider,
      dailyLimit: parseInt(dailySmsLimit, 10) || 5,
      status: 'Active',
      membersCount: 0,
    };

    setRanges([...ranges, newRange]);
    setIsCreateOpen(false);
    showToast(`Range "${newRange.name}" created successfully`);
    setRangeName('');
    setPrefix('');
    setProviderPayout('0.0000');
    setMemberPayout('0.0000');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const filteredRanges = ranges.filter((r) => {
    if (search.trim() && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 backdrop-blur-md flex items-center gap-2 text-xs font-semibold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header matching Screenshot 5 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--text-primary,#f8fafc)] tracking-tight">
            Ranges
          </h1>
          <p className="text-xs text-[var(--text-secondary,#94a3b8)]">
            Manage traffic ranges, payout rates, daily caps, and custom price sync.
          </p>
          <div className="pt-0.5">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              ADMIN
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Range</span>
          </button>
          <button
            onClick={() => showToast('Opened Range Lite')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary,#94a3b8)] border border-[var(--glass-border,#334155)] flex items-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Range Lite</span>
          </button>
          <button
            onClick={() => showToast('Import Ranges modal')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/90 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Ranges</span>
          </button>
          <button
            onClick={() => showToast('Smart Import active')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600/90 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Smart Import</span>
          </button>
          <button
            onClick={() => showToast('Downloading CSV template...')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary,#94a3b8)] border border-[var(--glass-border,#334155)] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>CSV Template</span>
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

      {/* 2. Top 3 KPI Cards matching Screenshot 5 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL RANGES */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              TOTAL RANGES
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              {ranges.length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary,#94a3b8)] mt-0.5">
              {ranges.filter((r) => r.status === 'Active').length} active for members
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* TOTAL NUMBERS */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              TOTAL NUMBERS
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              11,002
            </div>
            <div className="text-[11px] text-[var(--text-secondary,#94a3b8)] mt-0.5">
              Across all assigned ranges
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
        </div>

        {/* CONNECTED PROVIDERS */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary,#64748b)] uppercase font-semibold tracking-wider">
              CONNECTED PROVIDERS
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary,#f8fafc)] mt-1">
              1
            </div>
            <div className="text-[11px] text-[var(--text-secondary,#94a3b8)] mt-0.5">
              Supplying active ranges
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filters Section matching Screenshot 5 */}
      <div className="glass-card p-4 rounded-xl border border-[var(--glass-border,#334155)] space-y-3">
        <div>
          <h2 className="text-xs font-bold text-[var(--text-primary,#f8fafc)] uppercase tracking-wider">
            Filters
          </h2>
          <p className="text-[11px] text-[var(--text-tertiary,#64748b)]">
            Search by range name, prefix, or a phone number inside the range
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary,#64748b)]" />
            <input
              type="text"
              placeholder="Search: Range name, prefix, or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] text-xs text-[var(--text-primary,#f8fafc)] placeholder-[var(--text-tertiary,#64748b)] focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer font-mono"
            >
              <option value="10">Rows: 10</option>
              <option value="25">Rows: 25</option>
              <option value="50">Rows: 50</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Ranges Inventory Table matching Screenshot 5 */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border,#334155)] overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary,#f8fafc)]">
              Ranges Inventory
            </h2>
            <p className="text-xs text-[var(--text-secondary,#94a3b8)] mt-0.5">
              {ranges.length} ranges in current view
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[rgba(0,0,0,0.2)] text-[var(--text-secondary,#94a3b8)] border-b border-[var(--glass-border,#334155)] uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="py-3 px-4">RANGE NAME</th>
                <th className="py-3 px-4">PROVIDER</th>
                <th className="py-3 px-4">DAILY LIMIT</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">MEMBERS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border,#334155)]">
              {filteredRanges.map((r) => (
                <tr key={r.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-3.5 px-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[var(--text-primary,#f8fafc)]">
                      {r.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary,#64748b)]">
                      {r.totalNumbers.toLocaleString()} numbers
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[var(--text-secondary,#94a3b8)]">
                    {r.provider}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--text-primary,#f8fafc)]">
                    {r.dailyLimit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary,#94a3b8)]">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <span className="font-semibold font-mono">{r.membersCount}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => showToast(`Edit ${r.name}`)}
                        className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary,#94a3b8)] hover:text-teal-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => showToast(`Menu for ${r.name}`)}
                        className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary,#94a3b8)] hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add New Range Modal matching Screenshot 5 */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--card-bg,#1e293b)] text-[var(--text-primary,#f8fafc)] border border-[var(--glass-border,#334155)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border,#334155)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary,#f8fafc)]">
                    Add New Range
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-[var(--text-tertiary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)] p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRange} className="p-6 space-y-4 text-xs">
              <p className="text-[11px] text-[var(--text-tertiary,#64748b)] pb-1">
                Configure identity, provider payout, member payout, and daily caps.
              </p>

              {/* Row 1: Provider, Range Name, Prefix */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Provider <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Alaa0">Alaa0</option>
                    <option value="worldsms">worldsms</option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Range Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UK O2 Mobile"
                    value={rangeName}
                    onChange={(e) => setRangeName(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] placeholder:text-[var(--text-tertiary,#64748b)] focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Prefix <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="4477"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Provider Payout, Member Payout, Platform net profit banner */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Provider Payout <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary,#64748b)] font-semibold">$</span>
                    <input
                      type="text"
                      placeholder="0.0000"
                      value={providerPayout}
                      onChange={(e) => setProviderPayout(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary,#64748b)] mt-1">
                    Gross rate from provider per SMS
                  </p>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Member Payout <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary,#64748b)] font-semibold">$</span>
                    <input
                      type="text"
                      placeholder="0.0000"
                      value={memberPayout}
                      onChange={(e) => setMemberPayout(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary,#64748b)] mt-1">
                    Net rate paid to member per SMS
                  </p>
                </div>

                {/* Net profit callout banner */}
                <div className="sm:col-span-4 pb-4">
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-center gap-2 text-[11px] font-semibold">
                    <Info className="w-4 h-4 shrink-0 text-sky-400" />
                    <span>Platform net profit: ${platformNetProfit.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Payout Cycle, Daily SMS Limit, Active for Members toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Payout Cycle <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={payoutCycle}
                    onChange={(e) => setPayoutCycle(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Daily SMS Limit <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={dailySmsLimit}
                    onChange={(e) => setDailySmsLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary,#64748b)] mt-1">
                    Max messages per number per day
                  </p>
                </div>

                <div className="sm:col-span-4 flex items-center gap-2 pb-5">
                  <button
                    type="button"
                    onClick={() => setIsActiveForMembers(!isActiveForMembers)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActiveForMembers ? 'bg-teal-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isActiveForMembers ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-[var(--text-primary,#f8fafc)]">
                    Active for Members
                  </span>
                </div>
              </div>

              {/* Row 4: Internal Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Row 5: Callout Notice */}
              <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-teal-300 flex items-center gap-2.5 text-[11px]">
                <Info className="w-4 h-4 shrink-0 text-teal-400" />
                <span>Assign one test number from the Numbers page after importing numbers into this range.</span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--glass-border,#334155)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
                >
                  Create Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
