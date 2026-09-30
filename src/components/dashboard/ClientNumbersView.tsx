/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Hash,
  Search,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Calendar,
  DollarSign,
  AlertCircle,
  Shield,
  Trash2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CountryFlag } from '../ui/CountryFlag';

interface LeasedNumber {
  id: string;
  number: string;
  country: string;
  flag: string;
  prefix: string;
  monthlyCost: number;
  leasedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  status: 'ACTIVE' | 'EXPIRING';
  messagesReceived: number;
}

const INITIAL_NUMBERS: LeasedNumber[] = [
  {
    id: 'NUM-101',
    number: '+44 7911 123456',
    country: 'United Kingdom',
    flag: '🇬🇧',
    prefix: '+44 7911',
    monthlyCost: 2.5,
    leasedAt: '2026-08-24',
    expiresAt: '2026-10-24',
    autoRenew: true,
    status: 'ACTIVE',
    messagesReceived: 412,
  },
  {
    id: 'NUM-102',
    number: '+44 7911 987654',
    country: 'United Kingdom',
    flag: '🇬🇧',
    prefix: '+44 7911',
    monthlyCost: 2.5,
    leasedAt: '2026-08-24',
    expiresAt: '2026-10-24',
    autoRenew: true,
    status: 'ACTIVE',
    messagesReceived: 320,
  },
  {
    id: 'NUM-103',
    number: '+1 202 555 0192',
    country: 'United States',
    flag: '🇺🇸',
    prefix: '+1 202',
    monthlyCost: 1.8,
    leasedAt: '2026-09-01',
    expiresAt: '2026-10-01',
    autoRenew: true,
    status: 'EXPIRING',
    messagesReceived: 890,
  },
  {
    id: 'NUM-104',
    number: '+1 202 555 0147',
    country: 'United States',
    flag: '🇺🇸',
    prefix: '+1 202',
    monthlyCost: 1.8,
    leasedAt: '2026-09-01',
    expiresAt: '2026-10-01',
    autoRenew: false,
    status: 'EXPIRING',
    messagesReceived: 210,
  },
  {
    id: 'NUM-105',
    number: '+49 151 2345678',
    country: 'Germany',
    flag: '🇩🇪',
    prefix: '+49 151',
    monthlyCost: 3.0,
    leasedAt: '2026-08-15',
    expiresAt: '2026-10-15',
    autoRenew: true,
    status: 'ACTIVE',
    messagesReceived: 185,
  },
  {
    id: 'NUM-106',
    number: '+46 70 123 4567',
    country: 'Sweden',
    flag: '🇸🇪',
    prefix: '+46 70',
    monthlyCost: 2.2,
    leasedAt: '2026-09-10',
    expiresAt: '2026-10-10',
    autoRenew: true,
    status: 'ACTIVE',
    messagesReceived: 98,
  },
];

export const ClientNumbersView: React.FC = () => {
  const [numbers, setNumbers] = useState<LeasedNumber[]>(INITIAL_NUMBERS);
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('United Kingdom');
  const [leaseNotice, setLeaseNotice] = useState<string | null>(null);

  const handleCopy = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleAutoRenew = (id: string) => {
    setNumbers((prev) =>
      prev.map((n) => (n.id === id ? { ...n, autoRenew: !n.autoRenew } : n))
    );
  };

  const handleLeaseNumber = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    let newNumStr = '';
    let flag = '🇬🇧';
    let prefix = '+44 7911';
    let cost = 2.5;

    if (selectedCountry === 'United States') {
      flag = '🇺🇸';
      prefix = '+1 202';
      cost = 1.8;
      newNumStr = `+1 202 555 ${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (selectedCountry === 'Germany') {
      flag = '🇩🇪';
      prefix = '+49 151';
      cost = 3.0;
      newNumStr = `+49 151 ${randomSuffix}`;
    } else {
      newNumStr = `+44 7911 ${randomSuffix}`;
    }

    const newNumber: LeasedNumber = {
      id: `NUM-${Date.now().toString().slice(-4)}`,
      number: newNumStr,
      country: selectedCountry,
      flag,
      prefix,
      monthlyCost: cost,
      leasedAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      autoRenew: true,
      status: 'ACTIVE',
      messagesReceived: 0,
    };

    setNumbers((prev) => [newNumber, ...prev]);
    setIsLeaseModalOpen(false);
    setLeaseNotice(`Successfully leased new number: ${newNumStr} ($${cost}/mo deducted from wallet)`);
    setTimeout(() => setLeaseNotice(null), 4000);
  };

  const filteredNumbers = numbers.filter(
    (n) =>
      n.number.toLowerCase().includes(search.toLowerCase()) ||
      n.country.toLowerCase().includes(search.toLowerCase()) ||
      n.prefix.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 glass-card border-[rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                <Hash className="w-3.5 h-3.5 mr-1" />
                Active Leased Portfolio
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                WORLD SMS SERVICE Number Management
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              My Leased Numbers
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Your active virtual numbers dedicated to receiving SMS and verification OTPs.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLeaseModalOpen(true)}
            className="gap-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lease New Number</span>
          </Button>
        </div>

        {leaseNotice && (
          <div className="mt-4 p-2.5 bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)] rounded-xl text-xs flex items-center justify-between animate-fade-in font-medium">
            <span>{leaseNotice}</span>
            <button
              onClick={() => setLeaseNotice(null)}
              className="text-[var(--accent-emerald)] hover:opacity-75 text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by number or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </div>

        <div className="text-xs font-mono text-[var(--text-tertiary)] hidden sm:block">
          {filteredNumbers.length} numbers displayed
        </div>
      </div>

      {/* Numbers Table */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--table-th-bg)] border-b border-[var(--glass-border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-5">Phone Number</th>
                <th className="p-3.5">Country & Prefix</th>
                <th className="p-3.5">Capabilities</th>
                <th className="p-3.5">Monthly Cost</th>
                <th className="p-3.5">Total Received</th>
                <th className="p-3.5">Renewal Date</th>
                <th className="p-3.5">Auto-Renew</th>
                <th className="p-3.5 pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {filteredNumbers.map((n) => (
                <tr key={n.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--text-primary)] text-sm">
                        {n.number}
                      </span>
                      <button
                        onClick={() => handleCopy(n.id, n.number)}
                        className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
                        title="Copy number"
                        aria-label={`Copy phone number ${n.number}`}
                      >
                        {copiedId === n.id ? (
                          <Check className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <CountryFlag flag={n.flag} countryName={n.country} size="sm" className="text-base" />
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{n.country}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono">{n.prefix}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1">
                      <Badge variant="info" size="sm">SMS</Badge>
                      <Badge variant="success" size="sm">OTP</Badge>
                      <Badge variant="neutral" size="sm">2FA</Badge>
                    </div>
                  </td>

                  <td className="p-3.5 font-mono font-semibold text-[var(--text-primary)]">
                    ${n.monthlyCost.toFixed(2)}/mo
                  </td>

                  <td className="p-3.5 font-mono text-[var(--text-secondary)]">
                    {n.messagesReceived.toLocaleString()} msgs
                  </td>

                  <td className="p-3.5 font-mono text-[var(--text-tertiary)]">
                    {n.expiresAt}
                  </td>

                  <td className="p-3.5">
                    <button
                      onClick={() => handleToggleAutoRenew(n.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer border transition-colors ${
                        n.autoRenew
                          ? 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] border-[rgba(16,185,129,0.3)]'
                          : 'bg-[var(--input-bg-subtle)] text-[var(--text-tertiary)] border-[var(--glass-border)]'
                      }`}
                    >
                      {n.autoRenew ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>

                  <td className="p-3.5 pr-5 text-right">
                    <button
                      onClick={() => handleCopy(n.id, n.number)}
                      className="px-2.5 py-1 text-xs text-[var(--accent-blue)] hover:bg-[var(--accent-blue-dim)] rounded-lg transition-colors font-medium border border-[rgba(59,130,246,0.2)] cursor-pointer"
                    >
                      Quick Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lease New Number Modal */}
      {isLeaseModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsLeaseModalOpen(false)}
          title="Lease New Phone Number"
          subtitle="Choose country destination and prefix to lease an active SMS reception number"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-primary)]">Select Country Destination:</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
              >
                <option value="United Kingdom">United Kingdom (+44 7911) &mdash; $2.50 / mo</option>
                <option value="United States">United States (+1 202) &mdash; $1.80 / mo</option>
                <option value="Germany">Germany (+49 151) &mdash; $3.00 / mo</option>
              </select>
            </div>

            <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-tertiary)]">Capabilities Included:</span>
                <span className="font-medium text-[var(--accent-emerald)]">OTP + 2FA + Inbound Webhook</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-tertiary)]">Billing Term:</span>
                <span className="font-medium text-[var(--text-primary)]">30 Days (Auto-renew)</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)]">
                <span className="font-semibold text-[var(--text-primary)]">Deducted from Wallet:</span>
                <span className="font-mono font-bold text-sm text-[var(--accent-blue)]">
                  {selectedCountry === 'United States' ? '$1.80' : selectedCountry === 'Germany' ? '$3.00' : '$2.50'} USD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--glass-border)]">
              <Button variant="outline" size="sm" onClick={() => setIsLeaseModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleLeaseNumber}>
                Confirm & Lease Number
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
