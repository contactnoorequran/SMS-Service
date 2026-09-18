/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ArrowRight,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatRelativeTime, formatCurrency } from '../../utils/formatters';
import { apiClient } from '../../services/api';

interface CompactMessage {
  id: string;
  sender: string;
  receiver: string;
  status: string;
  createdAt: string;
  providerName?: string;
}

interface CompactTransaction {
  id: string;
  sequenceId: string;
  party: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  createdAt: string;
}

interface CompactRecentDataProps {
  onNavigateToTab: (tabId: string) => void;
}

export const CompactRecentData: React.FC<CompactRecentDataProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<CompactMessage[]>([
    {
      id: 'msg-1',
      sender: '+14155552671',
      receiver: '+447911123456',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      providerName: 'Zain Kuwait',
    },
    {
      id: 'msg-2',
      sender: '+447700900077',
      receiver: '+96598765432',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      providerName: 'Vodafone',
    },
    {
      id: 'msg-3',
      sender: '+12025550199',
      receiver: '+447911123456',
      status: 'RECEIVED',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      providerName: 'STC Link',
    },
    {
      id: 'msg-4',
      sender: '+33612345678',
      receiver: '+447911123456',
      status: 'DELIVERED',
      createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      providerName: 'Zain Kuwait',
    },
  ]);

  const [transactions, setTransactions] = useState<CompactTransaction[]>([
    {
      id: 'tx-1',
      sequenceId: '1042',
      party: 'Acme Global Corp',
      direction: 'DEBIT',
      amount: 0.045,
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
    {
      id: 'tx-2',
      sequenceId: '1041',
      party: 'Gulf Retailers LLC',
      direction: 'CREDIT',
      amount: 150.0,
      createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    },
    {
      id: 'tx-3',
      sequenceId: '1040',
      party: 'Nexus Logistics',
      direction: 'DEBIT',
      amount: 0.012,
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    },
    {
      id: 'tx-4',
      sequenceId: '1039',
      party: 'Wholesale Carrier Settlement',
      direction: 'DEBIT',
      amount: 28.4,
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Compact Recent Messages */}
      <div className="glass-card p-5 border-[var(--glass-border)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                  Recent Messages
                </h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Latest carrier gateway traffic & delivery receipts
                </p>
              </div>
            </div>
            <Badge variant="info" size="sm">
              Live Stream
            </Badge>
          </div>

          {/* Compact List */}
          <div className="divide-y divide-[var(--glass-border)] text-xs">
            {messages.map((msg) => (
              <div key={msg.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[var(--text-primary)] font-medium truncate">
                      {msg.sender}
                    </span>
                    <span className="text-[var(--text-tertiary)]">→</span>
                    <span className="text-[var(--text-secondary)] truncate">
                      {msg.receiver}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                    {msg.providerName || 'Carrier Link'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    {formatRelativeTime(msg.createdAt)}
                  </span>
                  <Badge
                    variant={msg.status === 'DELIVERED' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {msg.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Footer Link */}
        <button
          type="button"
          onClick={() => onNavigateToTab('traffic')}
          className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer w-full text-left"
        >
          <span>Open Messaging Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Compact Recent Transactions */}
      <div className="glass-card p-5 border-[var(--glass-border)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                  Recent Transactions
                </h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Sequential ledger postings & balance updates
                </p>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Settled
            </Badge>
          </div>

          {/* Compact List */}
          <div className="divide-y divide-[var(--glass-border)] text-xs">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)] font-semibold">
                      #{tx.sequenceId}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {tx.party}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    {formatRelativeTime(tx.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      tx.direction === 'CREDIT'
                        ? 'text-[var(--accent-emerald)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {tx.direction === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(3)}
                  </span>
                  <Badge
                    variant={tx.direction === 'CREDIT' ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {tx.direction}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card Footer Link */}
        <button
          type="button"
          onClick={() => onNavigateToTab('financials')}
          className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer w-full text-left"
        >
          <span>Open Financial Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
