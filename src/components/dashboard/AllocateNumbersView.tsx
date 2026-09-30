/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Info,
  UserCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface AllocateNumbersViewProps {
  onBackToNumbers?: () => void;
}

interface AllocationRecord {
  id: string;
  when: string;
  relativeTime: string;
  member: string;
  range: string;
  quantity: number;
  fileName: string;
}

export const AllocateNumbersView: React.FC<AllocateNumbersViewProps> = ({ onBackToNumbers }) => {
  const [allocationMode, setAllocationMode] = useState<'single' | 'multiple' | 'all'>('single');
  const [memberUsername, setMemberUsername] = useState('demouser');
  const [targetRange, setTargetRange] = useState('test-for-test');
  const [quantity, setQuantity] = useState('1000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Recent allocations matching Screenshot 1
  const [recentAllocations, setRecentAllocations] = useState<AllocationRecord[]>([
    {
      id: 'alloc-1',
      when: '2026-09-29 20:13:10',
      relativeTime: '14 hours ago',
      member: 'demouser',
      range: 'test-for-test',
      quantity: 1000,
      fileName: 'allocation_demouser_1000.txt',
    },
  ]);

  const handleExecuteAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberUsername.trim()) {
      showToast('Please enter member username');
      return;
    }
    const qtyNum = parseInt(quantity, 10) || 1000;
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const newRecord: AllocationRecord = {
        id: `alloc-${Date.now()}`,
        when: new Date().toISOString().replace('T', ' ').substring(0, 19),
        relativeTime: 'Just now',
        member: memberUsername.trim(),
        range: targetRange || 'test-for-test',
        quantity: qtyNum,
        fileName: `allocation_${memberUsername.trim()}_${qtyNum}.txt`,
      };

      setRecentAllocations([newRecord, ...recentAllocations]);
      showToast(`Successfully allocated ${qtyNum} numbers to ${memberUsername.trim()}!`);

      // Trigger automatic TXT file download
      const fileData = Array.from({ length: Math.min(qtyNum, 20) }, (_, i) => `44555559${String(i).padStart(4, '0')}`).join('\n');
      const blob = new Blob([fileData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = newRecord.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 600);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Recent allocations refreshed');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 backdrop-blur-md flex items-center gap-2 text-xs font-semibold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary,#f8fafc)] tracking-tight">
            Allocate Numbers
          </h1>
          <p className="text-xs text-[var(--text-secondary,#94a3b8)] mt-0.5">
            Assign available numbers to a member by single range, multiple ranges, or every range under a provider.
          </p>
          <div className="pt-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              ADMIN
            </span>
          </div>
        </div>

        {/* Back to Numbers button */}
        <button
          onClick={() => {
            if (onBackToNumbers) {
              onBackToNumbers();
            } else {
              window.history.pushState({}, '', '/numbers');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary,#94a3b8)] hover:text-white border border-[var(--glass-border,#334155)] hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Numbers</span>
        </button>
      </div>

      {/* Card 1: Instant Allocation Processor matching Screenshot 1 */}
      <div className="glass-card p-6 rounded-2xl border border-[var(--glass-border,#334155)] bg-[var(--bg-surface,#0f172a)] space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary,#f8fafc)]">
            Instant Allocation Processor
          </h2>
          <p className="text-[11px] text-[var(--text-tertiary,#64748b)] mt-0.5">
            Default member earning/SMS from each range is used automatically — no price override here.
          </p>
        </div>

        {/* Mode Tabs: Single Range | Multiple Ranges | All Provider Ranges */}
        <div className="flex items-center gap-1.5 border-b border-[var(--glass-border,#334155)] pb-3">
          <button
            type="button"
            onClick={() => setAllocationMode('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              allocationMode === 'single'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-[var(--text-secondary,#94a3b8)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            Single Range
          </button>
          <button
            type="button"
            onClick={() => setAllocationMode('multiple')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              allocationMode === 'multiple'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-[var(--text-secondary,#94a3b8)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            Multiple Ranges
          </button>
          <button
            type="button"
            onClick={() => setAllocationMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              allocationMode === 'all'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-[var(--text-secondary,#94a3b8)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            All Provider Ranges
          </button>
        </div>

        <form onSubmit={handleExecuteAllocation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: Member Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)]">
                1. Member Username <span className="text-rose-400">*</span>
              </label>
              <select
                value={memberUsername}
                onChange={(e) => setMemberUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="demouser">demouser (Active Member)</option>
                <option value="agent1">agent1 (SMS Agent)</option>
                <option value="client_wholesale">client_wholesale (Enterprise)</option>
              </select>
              <p className="text-[10px] text-[var(--text-tertiary,#64748b)]">
                Type at least 1 character to search by member username...
              </p>
              <button
                type="button"
                onClick={() => showToast(`Lookup confirmed for member: ${memberUsername}`)}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-colors cursor-pointer"
              >
                Lookup: Username
              </button>
            </div>

            {/* Field 2: Target Range */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)]">
                2. Target Range <span className="text-rose-400">*</span>
              </label>
              <select
                value={targetRange}
                onChange={(e) => setTargetRange(e.target.value)}
                className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="test-for-test">test-for-test (Alaa0 - 10,000 numbers)</option>
                <option value="Alaa Test">Alaa Test (UK - 1,002 numbers)</option>
              </select>
              <p className="text-[10px] text-[var(--text-tertiary,#64748b)]">
                Type at least 1 character...
              </p>
            </div>
          </div>

          {/* Field 3: Quantity Required */}
          <div className="space-y-1.5 max-w-md">
            <label className="text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)]">
              3. Quantity Required <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs font-mono text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500"
            />
            <p className="text-[10px] text-[var(--text-tertiary,#64748b)]">
              Cannot exceed available stock
            </p>
          </div>

          {/* Info callout matching Screenshot 1 */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 flex items-center gap-2 text-xs">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Search members by username. Default range earning/SMS applies automatically.</span>
          </div>

          {/* Action button matching Screenshot 1 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Execute Allocation & Download File</span>
          </button>
        </form>
      </div>

      {/* Card 2: Recent Allocations matching Screenshot 1 */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border,#334155)] bg-[var(--bg-surface,#0f172a)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--glass-border,#334155)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary,#f8fafc)]">
              Recent Allocations
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary,#64748b)] mt-0.5">
              Last 100 member allocations - 10 per page — re-download the TXT anytime
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg border border-[var(--glass-border,#334155)] text-[var(--text-secondary,#94a3b8)] hover:text-white hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--glass-border,#334155)] text-[10px] uppercase font-bold text-[var(--text-tertiary,#64748b)] bg-[rgba(0,0,0,0.15)]">
                <th className="py-3 px-5">WHEN</th>
                <th className="py-3 px-4">MEMBER</th>
                <th className="py-3 px-4">RANGE</th>
                <th className="py-3 px-4">QUANTITY</th>
                <th className="py-3 px-5 text-right">FILE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border,#334155)]">
              {recentAllocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs text-[var(--text-primary,#f8fafc)]">
                    <div>{alloc.when}</div>
                    <div className="text-[10px] text-[var(--text-tertiary,#64748b)] font-sans mt-0.5">
                      {alloc.relativeTime}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-xs text-[var(--text-primary,#f8fafc)]">
                    {alloc.member}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[var(--text-secondary,#94a3b8)] font-mono">
                    {alloc.range}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-[var(--text-primary,#f8fafc)]">
                    {alloc.quantity.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => showToast(`Downloaded ${alloc.fileName}`)}
                      className="text-blue-400 hover:text-blue-300 font-semibold text-xs cursor-pointer hover:underline"
                    >
                      Download
                    </button>
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
