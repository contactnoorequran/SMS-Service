/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Table, ColumnDef } from '../../ui/Table';
import {
  ClientDetail,
  ClientTransactionSummary,
} from '../../../types/clients';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  FileText,
  CreditCard,
  Building2,
} from 'lucide-react';

interface ClientTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetail | null;
}

export const ClientTransactionsModal: React.FC<ClientTransactionsModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');

  if (!client) return null;

  const transactions = client.financials?.recentTransactions || [];

  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
    if (directionFilter !== 'ALL' && tx.direction !== directionFilter) return false;
    return true;
  });

  const getTxTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'TOPUP':
        return 'success';
      case 'SMS_CHARGE':
        return 'info';
      case 'NUMBER_FEE':
        return 'purple';
      case 'REFUND':
        return 'warning';
      case 'ADJUSTMENT':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const columns: ColumnDef<ClientTransactionSummary>[] = [
    {
      key: 'id',
      header: 'Reference / ID',
      render: (tx) => (
        <div>
          <div className="font-mono text-xs text-[var(--text-primary)] font-semibold">
            {tx.id}
          </div>
          {tx.reference && (
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              Ref: {tx.reference}
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'type',
      header: 'Transaction Type',
      render: (tx) => (
        <Badge variant={getTxTypeBadgeVariant(tx.type)} size="sm">
          {tx.type.replace('_', ' ')}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
      render: (tx) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {tx.description}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx) => {
        const isCredit = tx.direction === 'CREDIT';
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            {isCredit ? (
              <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--accent-emerald)] shrink-0" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent-rose)] shrink-0" />
            )}
            <span className={isCredit ? 'text-[var(--accent-emerald)]' : 'text-[var(--accent-rose)]'}>
              {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      render: (tx) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {formatCurrency(tx.balanceAfter)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (tx) => (
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          {formatDate(tx.timestamp, true)}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Financial Ledger & Transactions: ${client.companyName}`}
      size="xl"
    >
      <div className="space-y-4 pt-1">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Current Balance
            </span>
            <div className="text-lg font-bold text-[var(--accent-emerald)] font-mono mt-0.5">
              {formatCurrency(client.balance)}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              {client.billingType} Model
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Credit Limit
            </span>
            <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
              {formatCurrency(client.financials?.creditLimit || 0)}
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              Authorized Overdraft
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Available Credit
            </span>
            <div className="text-lg font-bold text-[var(--accent-blue)] font-mono mt-0.5">
              {formatCurrency(client.financials?.availableCredit || client.balance)}
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              Immediate Dispatch Room
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Lifetime Spent
            </span>
            <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
              {formatCurrency(client.financials?.totalSpent || 0)}
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              Settled Messaging Fees
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)] font-medium">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-hidden"
              >
                <option value="ALL">All Types</option>
                <option value="TOPUP">TOPUP</option>
                <option value="SMS_CHARGE">SMS CHARGE</option>
                <option value="NUMBER_FEE">NUMBER FEE</option>
                <option value="REFUND">REFUND</option>
                <option value="ADJUSTMENT">ADJUSTMENT</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)] font-medium">Direction:</span>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:outline-hidden"
              >
                <option value="ALL">All Directions</option>
                <option value="CREDIT">Credits (+)</option>
                <option value="DEBIT">Debits (-)</option>
              </select>
            </div>
          </div>

          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Showing {filteredTransactions.length} of {transactions.length} entries
          </span>
        </div>

        {/* Transactions Table */}
        <Table
          columns={columns}
          data={filteredTransactions}
          keyExtractor={(t) => t.id}
          emptyMessage="No financial ledger transactions recorded."
        />

        {/* Footer Close */}
        <div className="flex items-center justify-end pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Ledger
          </Button>
        </div>
      </div>
    </Modal>
  );
};
