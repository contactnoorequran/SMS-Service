/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Table, ColumnDef } from '../../ui/Table';
import { NumberAssignmentHistoryItem } from '../../../types/numbers';
import { formatDate, formatRelativeTime } from '../../../utils/formatters';
import { History, Building2, User, Clock, ShieldCheck, FileText } from 'lucide-react';

interface NumberAssignmentHistoryProps {
  histories: NumberAssignmentHistoryItem[];
}

export const NumberAssignmentHistory: React.FC<NumberAssignmentHistoryProps> = ({ histories }) => {
  const columns: ColumnDef<NumberAssignmentHistoryItem>[] = [
    {
      key: 'client',
      header: 'Assigned Enterprise Client',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shrink-0">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-xs text-[var(--text-primary)] block">
              {item.clientName}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              ID: {item.clientId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'agent',
      header: 'Supervising Agent',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>{item.agentName || 'Platform Direct'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle State',
      render: (item) => (
        <Badge variant={item.endedAt ? 'neutral' : 'success'}>
          {item.endedAt ? 'HISTORICAL (ENDED)' : 'CURRENTLY ACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Assignment Start',
      render: (item) => (
        <div>
          <span className="font-mono text-xs text-[var(--text-primary)] block">
            {formatDate(item.assignedAt)}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {formatRelativeTime(item.assignedAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'endedAt',
      header: 'Assignment End',
      render: (item) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {item.endedAt ? formatDate(item.endedAt) : '— Active Today'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Audit Reason & Operator',
      render: (item) => (
        <div className="max-w-[220px]">
          <span className="text-xs text-[var(--text-secondary)] truncate block">
            {item.reason || 'Standard allocation'}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            By: {item.changedBy || 'system'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--accent-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Append-Only Assignment History
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Immutable Ledger ({histories.length} records)
        </span>
      </div>

      <Table
        columns={columns}
        data={histories}
        keyExtractor={(item) => item.id}
        emptyMessage="No historical assignment records logged for this phone number"
      />
    </Card>
  );
};
