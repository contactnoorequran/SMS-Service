/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { NumberTrafficSummary } from '../../../types/numbers';
import { formatNumber, formatPercent, formatRelativeTime } from '../../../utils/formatters';
import { Activity, ArrowDownLeft, ArrowUpRight, Zap, CheckCircle2, Clock } from 'lucide-react';

interface NumberTrafficCardProps {
  traffic: NumberTrafficSummary;
}

export const NumberTrafficCard: React.FC<NumberTrafficCardProps> = ({ traffic }) => {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[var(--accent-purple)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Traffic & Ingress Telemetry Snapshot
          </h3>
        </div>
        <Badge variant="success">ACTIVE STREAM</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total SMS Count */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
            Total Messages
          </span>
          <div className="font-mono text-base font-bold text-[var(--text-primary)]">
            {formatNumber(traffic.smsCount)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">Aggregated lifetime</span>
        </div>

        {/* Inbound Messages */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Inbound
            </span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
          </div>
          <div className="font-mono text-base font-bold text-[var(--accent-emerald)]">
            {formatNumber(traffic.inboundVolume)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">Subscriber OTP & replies</span>
        </div>

        {/* Outbound Messages */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Outbound
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
          </div>
          <div className="font-mono text-base font-bold text-[var(--accent-blue)]">
            {formatNumber(traffic.outboundVolume)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">Direct MT dispatch</span>
        </div>

        {/* Delivery Rate */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Delivery Rate
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
          </div>
          <div className="font-mono text-base font-bold text-[var(--accent-emerald)]">
            {formatPercent(traffic.deliveryRate)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">DLR Acknowledged</span>
        </div>
      </div>

      {/* Operational Sub-info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[var(--text-secondary)] font-mono border-t border-[var(--border-subtle)]/50">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
          <span>Ingress Throughput: {traffic.throughputTps || 0} TPS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Last Activity: {traffic.lastMessageAt ? formatRelativeTime(traffic.lastMessageAt) : 'No messages'}</span>
        </div>
      </div>
    </Card>
  );
};
