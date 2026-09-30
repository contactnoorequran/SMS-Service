/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  TrendingDown,
  Shield,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'NUMBER_LEASE' | 'API_USAGE';
  description: string;
  amount: number;
  balanceAfter: number;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-901',
    type: 'DEPOSIT',
    description: 'Wallet Deposit via Bank Wire (Ref #WIRE-98218)',
    amount: 500.0,
    balanceAfter: 245.8,
    date: '2026-09-24 14:10',
    status: 'PENDING',
  },
  {
    id: 'TX-899',
    type: 'NUMBER_LEASE',
    description: 'Monthly Lease Renewal: 8 virtual numbers',
    amount: -18.6,
    balanceAfter: 245.8,
    date: '2026-09-20 00:00',
    status: 'COMPLETED',
  },
  {
    id: 'TX-880',
    type: 'DEPOSIT',
    description: 'Deposit via Credit Card (*4492)',
    amount: 250.0,
    balanceAfter: 264.4,
    date: '2026-09-01 10:15',
    status: 'COMPLETED',
  },
  {
    id: 'TX-850',
    type: 'API_USAGE',
    description: 'Inbound SMS carrier throughput fees (August)',
    amount: -35.6,
    balanceAfter: 14.4,
    date: '2026-08-31 23:59',
    status: 'COMPLETED',
  },
];

export const ClientWalletView: React.FC = () => {
  const [balance, setBalance] = useState<number>(245.8);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('250');
  const [depositMethod, setDepositMethod] = useState<string>('BANK_WIRE');
  const [depositRef, setDepositRef] = useState<string>('');
  const [depositNotice, setDepositNotice] = useState<string | null>(null);

  const handleDepositSubmit = () => {
    const amt = parseFloat(depositAmount) || 100;
    const newTx: Transaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'DEPOSIT',
      description: `Wallet Deposit via ${depositMethod.replace('_', ' ')} ${depositRef ? `(${depositRef})` : ''}`,
      amount: amt,
      balanceAfter: balance + amt,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'PENDING',
    };

    setTransactions((prev) => [newTx, ...prev]);
    setIsDepositModalOpen(false);
    setDepositRef('');
    setDepositNotice(
      `Deposit request for $${amt.toFixed(2)} USD submitted! It will appear in your balance once approved by your manager.`
    );
    setTimeout(() => setDepositNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 glass-card border-[rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <Wallet className="w-3.5 h-3.5 mr-1" />
                Wallet & Billing
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                WORLD SMS SERVICE Financial Clearing
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Wallet & Deposits
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Manage your balance, deposit funds for number lease renewals, and download financial statements.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDepositModalOpen(true)}
            className="gap-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deposit Funds</span>
          </Button>
        </div>

        {depositNotice && (
          <div className="mt-4 p-2.5 bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)] rounded-xl text-xs flex items-center justify-between animate-fade-in font-medium">
            <span>{depositNotice}</span>
            <button
              onClick={() => setDepositNotice(null)}
              className="text-[var(--accent-emerald)] hover:opacity-75 text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Balance & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Balance */}
        <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4 text-[var(--accent-emerald)]" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-[var(--accent-emerald)]">
              ${balance.toFixed(2)} USD
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
              Active currency: USD (Sub-cent decimal resolution)
            </div>
          </div>
        </div>

        {/* Card 2: Projected Monthly Burn */}
        <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>Projected Monthly Spend</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-mono text-[var(--text-primary)]">
              $18.60 / mo
            </div>
            <div className="text-[11px] text-[var(--accent-emerald)] mt-1">
              Balance covers ~13.2 months of number leases
            </div>
          </div>
        </div>

        {/* Card 3: Quick Deposit CTA */}
        <div className="glass-card p-5 rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.03)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Need More Capacity?
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Top up your balance via Wire Transfer, USDT, or Credit Card.
            </p>
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDepositModalOpen(true)}
              className="w-full text-xs"
            >
              Add Funds Now
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[rgba(0,0,0,0.15)] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span>Transaction Ledger & Receipts</span>
          </h3>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">{transactions.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[rgba(0,0,0,0.2)] border-b border-[var(--glass-border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5 pl-5">Transaction ID</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Running Balance</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3.5 pl-5 font-mono text-[var(--accent-blue)] font-semibold">
                    {tx.id}
                  </td>
                  <td className="p-3.5">
                    <Badge
                      variant={
                        tx.type === 'DEPOSIT'
                          ? 'success'
                          : tx.type === 'NUMBER_LEASE'
                          ? 'info'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {tx.type}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-[var(--text-primary)] max-w-sm truncate">
                    {tx.description}
                  </td>
                  <td
                    className={`p-3.5 font-mono font-bold ${
                      tx.amount > 0 ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                  </td>
                  <td className="p-3.5 font-mono text-[var(--text-secondary)]">
                    ${tx.balanceAfter.toFixed(2)}
                  </td>
                  <td className="p-3.5 font-mono text-[var(--text-tertiary)]">
                    {tx.date}
                  </td>
                  <td className="p-3.5">
                    <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 pr-5 text-right">
                    <button
                      onClick={() => alert(`Downloading Invoice Receipt for ${tx.id}...`)}
                      className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--glass-bg)] transition-colors cursor-pointer"
                      title="Download Invoice"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDepositModalOpen(false)}
          title="Deposit Funds to Wallet"
          subtitle="Submit a balance top-up request to your assigned manager"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            {/* Amount Presets */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-primary)]">Select Amount (USD):</label>
              <div className="grid grid-cols-4 gap-2">
                {['50', '100', '250', '500'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDepositAmount(preset)}
                    className={`py-2 rounded-lg font-mono font-bold border transition-colors cursor-pointer ${
                      depositAmount === preset
                        ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]'
                        : 'bg-[rgba(0,0,0,0.2)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:bg-[var(--glass-bg)]'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-primary)]">Payment Method:</label>
              <select
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
              >
                <option value="BANK_WIRE">Bank Wire Transfer (SWIFT / SEPA)</option>
                <option value="CRYPTO_USDT">USDT Cryptocurrency (TRC-20)</option>
                <option value="CREDIT_CARD">Corporate Credit Card (Stripe)</option>
              </select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-primary)]">
                Payment Reference / Transaction Hash:
              </label>
              <input
                type="text"
                placeholder="e.g. SWIFT Ref #9921, TXID 8a9f..."
                value={depositRef}
                onChange={(e) => setDepositRef(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)]">
              Your request will be routed directly to your supervisory manager for verification. Funds are added immediately upon confirmation.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--glass-border)]">
              <Button variant="outline" size="sm" onClick={() => setIsDepositModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleDepositSubmit}>
                Submit Deposit Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
