/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  ArrowRight,
  Receipt,
  Inbox,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatRelativeTime } from '../../utils/formatters';
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
  const [messages, setMessages] = useState<CompactMessage[]>([]);
  const [transactions, setTransactions] = useState<CompactTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [messagesRes, cdrRes] = await Promise.allSettled([
        apiClient.getInboundMessages({ limit: 4 }),
        apiClient.getCdrs({ limit: 4 }),
      ]);

      if (messagesRes.status === 'fulfilled' && messagesRes.value) {
        const rawMsgs = messagesRes.value.items || (Array.isArray(messagesRes.value) ? messagesRes.value : []);
        setMessages(
          rawMsgs.map((m: any) => ({
            id: m.id,
            sender: m.fromNumber || m.sender || m.senderAddress || '--',
            receiver: m.toNumber || m.receiver || m.destinationAddress || '--',
            status: m.status || 'RECEIVED',
            createdAt: m.receivedAt || m.createdAt || new Date().toISOString(),
            providerName: m.provider?.name || m.providerName,
          }))
        );
      } else {
        setMessages([]);
      }

      if (cdrRes.status === 'fulfilled' && cdrRes.value) {
        const rawCdrs = cdrRes.value.items || (Array.isArray(cdrRes.value) ? cdrRes.value : []);
        setTransactions(
          rawCdrs.map((c: any, idx: number) => ({
            id: c.id || `cdr-${idx}`,
            sequenceId: String(c.sequenceId || c.id?.slice(-4) || idx + 1),
            party: c.client?.companyName || c.client?.name || c.clientName || 'Platform Ingress',
            direction: 'DEBIT',
            amount: Number(c.clientChargeDecimal || c.clientPayout || 0),
            createdAt: c.createdAt || new Date().toISOString(),
          }))
        );
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load recent activity streams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
            {messages.length > 0 && (
              <Badge variant="info" size="sm">
                Live Stream
              </Badge>
            )}
          </div>

          {/* Messages Content */}
          {isLoading ? (
            <div className="space-y-2.5 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg glass-skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="py-6 text-center text-xs text-[var(--accent-rose)] flex flex-col items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Unable to load messages</span>
              <button
                type="button"
                onClick={loadData}
                className="text-[11px] text-[var(--accent-blue)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-[var(--text-tertiary)]">
              <Inbox className="w-6 h-6 mb-1.5 opacity-50" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">No messages received</p>
              <p className="text-[11px]">Inbound message stream will appear here when traffic arrives.</p>
            </div>
          ) : (
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
                    {msg.providerName && (
                      <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                        {msg.providerName}
                      </span>
                    )}
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
          )}
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
            {transactions.length > 0 && (
              <Badge variant="success" size="sm">
                Settled
              </Badge>
            )}
          </div>

          {/* Transactions Content */}
          {isLoading ? (
            <div className="space-y-2.5 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg glass-skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="py-6 text-center text-xs text-[var(--accent-rose)] flex flex-col items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Unable to load transactions</span>
              <button
                type="button"
                onClick={loadData}
                className="text-[11px] text-[var(--accent-blue)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-[var(--text-tertiary)]">
              <Inbox className="w-6 h-6 mb-1.5 opacity-50" />
              <p className="text-xs font-medium text-[var(--text-secondary)]">No transactions recorded</p>
              <p className="text-[11px]">Ledger entries will appear as messages are routed and rated.</p>
            </div>
          ) : (
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
                      {tx.direction === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(4)}
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
          )}
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
