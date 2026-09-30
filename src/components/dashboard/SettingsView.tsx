/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Sliders,
  CheckCircle2,
  DollarSign,
  Layers,
  UserCheck,
  Save,
  Plus,
  RefreshCw,
  Info,
  Shield,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PayoutMethod {
  id: string;
  name: string;
  sublabel: string;
  status: 'Enabled' | 'Disabled';
  requireDetails: 'Off' | 'On';
  detailsLabel: string;
  isBuiltIn: boolean;
}

export const SettingsView: React.FC = () => {
  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Card 1: Member Number Request Limit
  const [memberDefaultLimit, setMemberDefaultLimit] = useState(5);

  // Card 2: Client Number Requests
  const [allowClientRequests, setAllowClientRequests] = useState('Disabled – clients cannot request numbers');
  const [clientMaxNumbers, setClientMaxNumbers] = useState('100');

  // Card 3: Display Currency
  const [displayCurrency, setDisplayCurrency] = useState('US Dollar ($)');

  // Card 4: Member Withdrawals
  const [allowWithdrawals, setAllowWithdrawals] = useState('Enabled – members can request payouts');
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState('35');

  // Payout Methods
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([
    {
      id: 'usdt-usd',
      name: 'USDT (USD Method)',
      sublabel: 'USD METHOD',
      status: 'Enabled',
      requireDetails: 'Off',
      detailsLabel: '',
      isBuiltIn: true,
    },
    {
      id: 'usdt-cash',
      name: 'USDT (Cash Method)',
      sublabel: 'CASH METHOD',
      status: 'Enabled',
      requireDetails: 'Off',
      detailsLabel: '',
      isBuiltIn: true,
    },
  ]);

  const [newMethodName, setNewMethodName] = useState('');

  const handleAddMethod = () => {
    if (!newMethodName.trim()) return;
    const newMethod: PayoutMethod = {
      id: `method-${Date.now()}`,
      name: newMethodName.trim(),
      sublabel: 'CUSTOM METHOD',
      status: 'Enabled',
      requireDetails: 'Off',
      detailsLabel: '',
      isBuiltIn: false,
    };
    setPayoutMethods([...payoutMethods, newMethod]);
    setNewMethodName('');
    showToast(`Added payout method "${newMethod.name}"`);
  };

  const updateMethodStatus = (id: string, status: 'Enabled' | 'Disabled') => {
    setPayoutMethods(
      payoutMethods.map((m) => (m.id === id ? { ...m, status } : m))
    );
  };

  const updateMethodDetails = (id: string, requireDetails: 'Off' | 'On') => {
    setPayoutMethods(
      payoutMethods.map((m) => (m.id === id ? { ...m, requireDetails } : m))
    );
  };

  const updateMethodLabel = (id: string, label: string) => {
    setPayoutMethods(
      payoutMethods.map((m) => (m.id === id ? { ...m, detailsLabel: label } : m))
    );
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

      {/* 1. Header matching Screenshots 3 & 5 */}
      <div className="space-y-1 pb-1">
        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          Manage member limits, auto-reclaim, live chat, withdrawals, and system preferences.
        </p>
        <div className="pt-0.5">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
            ADMIN
          </span>
        </div>
      </div>

      {/* 2. Top 3 Metric Cards matching Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL MEMBERS */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              TOTAL MEMBERS
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              2
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Registered member accounts
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* CUSTOM LIMITS */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              CUSTOM LIMITS
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              2
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Members with override limits
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        {/* SYSTEM DEFAULT */}
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              SYSTEM DEFAULT
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              0
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Default: 5 numbers / range
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Card 1: Member Number Request Limit */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Member Number Request Limit
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Control how many numbers each member can request per range
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[rgba(255,255,255,0.06)] border border-[var(--glass-border)] text-[var(--text-secondary)]">
              Default: {memberDefaultLimit}
            </span>
            <button
              onClick={() => showToast('Applied limit to all members')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Limit to All</span>
            </button>
            <button
              onClick={() => {
                setMemberDefaultLimit(5);
                showToast('Reset limits to system default');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] border border-[var(--glass-border)] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All to Default</span>
            </button>
            <button
              onClick={() => showToast('Navigating to Custom Prices')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] border border-[var(--glass-border)] flex items-center gap-1.5 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5 text-teal-400" />
              <span>Custom Prices</span>
            </button>
            <button
              onClick={() => showToast('Navigating to Wholesale Prices')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] border border-[var(--glass-border)] flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wholesale Prices</span>
            </button>
            <button
              onClick={() => showToast('Navigating to User Management')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] border border-[var(--glass-border)] flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>User Management</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] leading-relaxed">
          The system default is 5 numbers per range. Use the actions above to apply a bulk limit, reset all members, manage member custom prices, or set wholesale range prices. Individual limits can be set from User Management.
        </div>
      </div>

      {/* 4. Card 2: Client Number Requests */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Client Number Requests
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Allow clients to request numbers from the system pool. Members approve or reject each request (or use auto-approve).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">
              Disabled
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
              Client max: {clientMaxNumbers}
            </span>
          </div>
        </div>

        {/* Field 1: Allow clients */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Allow clients to request numbers
          </label>
          <div className="flex items-center gap-3">
            <select
              value={allowClientRequests}
              onChange={(e) => setAllowClientRequests(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="Disabled – clients cannot request numbers">
                Disabled – clients cannot request numbers
              </option>
              <option value="Enabled – clients can request numbers">
                Enabled – clients can request numbers
              </option>
            </select>
            <button
              onClick={() => showToast('Client request setting saved')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Default is off. When enabled, clients submit requests from the system pool. The client max below applies (never higher than the member's own limit). Members review requests under My Numbers → Client Requests.
          </p>
        </div>

        {/* Field 2: Max numbers per range */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Max numbers per range for clients
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={clientMaxNumbers}
              onChange={(e) => setClientMaxNumbers(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 font-mono"
            />
            <button
              onClick={() => showToast(`Client max numbers updated to ${clientMaxNumbers}`)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Global cap for every client account (1–10,000). Separate from the member limit. Effective client limit is the lower of this value and the member's own max.
          </p>
        </div>
      </div>

      {/* 5. Card 3: Display Currency */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Display Currency
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Symbol shown across admin and member panels (balances, earnings, range prices, reports). Amounts are not converted.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            $ USD
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Official display currency
          </label>
          <div className="flex items-center gap-3">
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="US Dollar ($)">US Dollar ($)</option>
              <option value="Euro (€)">Euro (€)</option>
              <option value="British Pound (£)">British Pound (£)</option>
              <option value="Tether USDT (₮)">Tether USDT (₮)</option>
            </select>
            <button
              onClick={() => showToast(`Display currency saved as ${displayCurrency}`)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Changes $ / € / £ labels only. Stored numbers, SMS earnings math, and payout method keys stay the same.
          </p>
        </div>
      </div>

      {/* 6. Card 4: Member Withdrawals (from Screenshot 5) */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Member Withdrawals
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Minimum balance and payout methods available to members
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30">
              Requests Open
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
              Min ${minWithdrawalAmount}.00
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
              USDT (USD Method)
            </span>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
              USDT (Cash Method)
            </span>
          </div>
        </div>

        {/* Withdrawal Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Allow members to submit withdrawal requests
          </label>
          <div className="flex items-center gap-3">
            <select
              value={allowWithdrawals}
              onChange={(e) => setAllowWithdrawals(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="Enabled – members can request payouts">
                Enabled – members can request payouts
              </option>
              <option value="Disabled – members cannot request payouts">
                Disabled – members cannot request payouts
              </option>
            </select>
            <button
              onClick={() => showToast('Withdrawal status saved')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Save Status
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            When disabled, members cannot create new withdrawal requests. Their history and pending payouts stay visible.
          </p>
        </div>

        {/* Minimum withdrawal amount */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Minimum withdrawal amount (USD)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={minWithdrawalAmount}
              onChange={(e) => setMinWithdrawalAmount(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 font-mono"
            />
            <button
              onClick={() => showToast(`Minimum withdrawal amount set to $${minWithdrawalAmount}`)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Save Minimum
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Members withdraw their full available balance in one request. If available balance is below this minimum, the withdrawal is blocked.
          </p>
        </div>

        {/* Payout Methods Subtable */}
        <div className="pt-2 space-y-3">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              Payout methods
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              Per method, you can require members to enter payout details (e.g. wallet address). Leave details off for methods that do not need them.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--glass-border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-secondary)] border-b border-[var(--glass-border)] uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">DISPLAY NAME</th>
                  <th className="py-3 px-4 w-32">STATUS</th>
                  <th className="py-3 px-4 w-32">REQUIRE DETAILS</th>
                  <th className="py-3 px-4">DETAILS LABEL</th>
                  <th className="py-3 px-4 text-right w-24">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {payoutMethods.map((method) => (
                  <tr key={method.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {method.name}
                      </div>
                      <div className="text-[9px] uppercase font-mono text-[var(--text-tertiary)]">
                        {method.sublabel}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={method.status}
                        onChange={(e) => updateMethodStatus(method.id, e.target.value as any)}
                        className="w-full px-2 py-1 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={method.requireDetails}
                        onChange={(e) => updateMethodDetails(method.id, e.target.value as any)}
                        className="w-full px-2 py-1 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="Off">Off</option>
                        <option value="On">On</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="e.g. USDT TRC20 Address"
                        value={method.detailsLabel}
                        onChange={(e) => updateMethodLabel(method.id, e.target.value)}
                        className="w-full px-3 py-1.5 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] border border-[var(--glass-border)]">
                        Built-in
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Method Row */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="New method name (e.g. PayPal, Bank Transfer)"
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              className="flex-1 px-3 py-2 bg-[var(--input-bg)] border-[var(--input-border)] border border-[var(--glass-border)] rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleAddMethod}
              className="px-3.5 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] border border-[var(--glass-border)] text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Add Method
            </button>
            <button
              onClick={() => showToast('Payout methods configuration saved')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Save Methods
            </button>
          </div>

          <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed pt-1">
            At least one method must stay enabled. Built-in methods (USD / Cash) cannot be deleted. When details are On, members must fill that field when requesting a withdrawal with that method.
          </p>
        </div>
      </div>
    </div>
  );
};
