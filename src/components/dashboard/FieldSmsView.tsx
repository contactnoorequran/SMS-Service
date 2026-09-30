/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  RefreshCw,
  Search,
  Hash,
  AtSign,
  Radio,
  FileText,
  Smartphone,
  MessageSquare,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface FieldSmsItem {
  id: string;
  receivedAt: string;
  provider: string;
  toNumber: string;
  fromSender: string;
  messageText: string;
}

export const FieldSmsView: React.FC = () => {
  const [fieldNumber, setFieldNumber] = useState('');
  const [senderSearch, setSenderSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [perPage, setPerPage] = useState('25');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Field SMS list (defaults to empty matching clean system / screenshot 2)
  const [messages, setMessages] = useState<FieldSmsItem[]>([]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  };

  const todayDateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* 1. Header matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Field SMS
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Inbound messages for destination numbers not registered in the system — discover new field numbers from providers.
          </p>
          <div className="pt-0.5">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              ADMIN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>Today</span>
          </Button>
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
        </div>
      </div>

      {/* 2. Three KPI Cards matching Screenshot 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TODAY */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              TODAY
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              0
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Unregistered field messages
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* FIELD NUMBERS */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              FIELD NUMBERS
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              0
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Unique numbers today
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* ALL TIME */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              ALL TIME
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              0
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Total field SMS stored
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Box matching Screenshot 2 */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
        <div>
          <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Filters
          </h2>
          <p className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5">
            {todayDateStr}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 text-xs">
          {/* Search Field Number */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Search Field Number
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="e.g. 447700900123"
                value={fieldNumber}
                onChange={(e) => setFieldNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              Matches the destination [TO] number
            </p>
          </div>

          {/* Search Sender */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Search Sender
            </label>
            <div className="relative">
              <AtSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="@ e.g. WhatsApp"
                value={senderSearch}
                onChange={(e) => setSenderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Provider */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">Provider: All</option>
              <option value="Alaa0">Alaa0</option>
              <option value="worldsms">worldsms</option>
            </select>
          </div>

          {/* From Date */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 font-mono cursor-pointer"
            />
          </div>
        </div>

        {/* Per page row */}
        <div className="flex items-center justify-between pt-1">
          <div className="w-32">
            <label className="block text-[10px] font-semibold text-[var(--text-tertiary)] mb-0.5">
              Per page
            </label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer font-mono"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Unregistered Field Traffic Section matching Screenshot 2 */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="p-5 border-b border-[var(--glass-border)]">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Unregistered Field Traffic
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            These destination numbers are not in Numbers / Ranges. Add them to the system when you want normal billing and member reports.
          </p>
        </div>

        {/* Empty State */}
        {messages.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <p className="text-xs text-[var(--text-tertiary)] font-medium">
              No field SMS found for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-secondary)] border-b border-[var(--glass-border)] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">DATE / TIME</th>
                  <th className="py-3 px-4">PROVIDER</th>
                  <th className="py-3 px-4">DESTINATION [TO]</th>
                  <th className="py-3 px-4">SENDER [FROM]</th>
                  <th className="py-3 px-4">MESSAGE</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {messages.map((m) => (
                  <tr key={m.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                      {m.receivedAt}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {m.provider}
                    </td>
                    <td className="py-3 px-4 font-mono text-teal-400 font-semibold">
                      {m.toNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                      {m.fromSender}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-primary)] max-w-xs truncate">
                      {m.messageText}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-[11px] font-semibold transition-colors">
                        Add to Ranges
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
