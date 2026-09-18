/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { NumberDetail, NumberStatus } from '../../../types/numbers';
import { formatDate, formatRelativeTime } from '../../../utils/formatters';
import { NumberProviderCard } from './NumberProviderCard';
import { NumberTrafficCard } from './NumberTrafficCard';
import { NumberAssignmentHistory } from './NumberAssignmentHistory';
import {
  ArrowLeft,
  Hash,
  Building2,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Power,
  PowerOff,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Zap,
} from 'lucide-react';

interface NumberDetailsViewProps {
  number: NumberDetail;
  onBack: () => void;
  onAssign: (number: NumberDetail) => void;
  onReassign: (number: NumberDetail) => void;
  onRelease: (number: NumberDetail) => void;
  onStatusChange: (number: NumberDetail, targetStatus: NumberStatus) => void;
}

export const NumberDetailsView: React.FC<NumberDetailsViewProps> = ({
  number,
  onBack,
  onAssign,
  onReassign,
  onRelease,
  onStatusChange,
}) => {
  const getStatusBadgeVariant = (status: NumberStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'ASSIGNED':
        return 'info';
      case 'RESERVED':
        return 'warning';
      case 'SUSPENDED':
      case 'DECOMMISSIONED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const isAssigned = number.status === 'ASSIGNED' && number.activeAssignment !== null;
  const isAvailable = number.status === 'AVAILABLE';
  const isSuspended = number.status === 'SUSPENDED';

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations', onClick: onBack },
              { label: 'Numbers', onClick: onBack },
              { label: number.e164 },
            ]}
          />
          <div className="flex items-center gap-3 mt-1.5">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--accent-blue)]"
              aria-label="Return to numbers directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{number?.country?.flag || '🌐'}</span>
              <h1 className="text-xl font-bold font-mono text-[var(--text-primary)] tracking-tight">
                {number.e164}
              </h1>
              <Badge variant={getStatusBadgeVariant(number.status)}>
                {number.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isAvailable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAssign(number)}
              aria-label="Allocate number to client"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Allocate to Client
            </Button>
          )}

          {isAssigned && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReassign(number)}
                aria-label="Reassign number to different client"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Reassign Client
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => onRelease(number)}
                aria-label="Release number from active assignment"
              >
                <PowerOff className="w-3.5 h-3.5 mr-1.5" />
                Release to Pool
              </Button>
            </>
          )}

          {/* Suspend / Resume toggle */}
          {isSuspended ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStatusChange(number, number.activeAssignment ? 'ASSIGNED' : 'AVAILABLE')}
              aria-label="Resume number operation"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-emerald)]" />
              Resume Routing
            </Button>
          ) : (
            number.status !== 'DECOMMISSIONED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onStatusChange(number, 'SUSPENDED')}
                aria-label="Suspend number routing"
              >
                <Power className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-rose)]" />
                Suspend Line
              </Button>
            )
          )}
        </div>
      </div>

      {/* Current Active Assignment Spotlight Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--accent-blue)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Current Active Assignment
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            ActiveAssignment Record
          </span>
        </div>

        {number.activeAssignment ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Assigned Client */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Client Enterprise
              </span>
              <div className="font-semibold text-sm text-[var(--text-primary)]">
                {number?.activeAssignment?.client?.companyName || 'Unknown Client'}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                {number?.activeAssignment?.client?.email || ''}
              </div>
            </div>

            {/* Supervising Agent */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Supervising Agent
              </span>
              <div className="font-semibold text-sm text-[var(--text-primary)]">
                {number?.activeAssignment?.agent ? number.activeAssignment.agent.name : 'Platform Direct'}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                {number?.activeAssignment?.agent ? number.activeAssignment.agent.email : 'No agent commission tier'}
              </div>
            </div>

            {/* Assignment Timestamps & Actions */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Assignment Timeline
              </span>
              <div className="font-mono text-xs text-[var(--text-primary)]">
                {formatDate(number?.activeAssignment?.assignedAt)}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Duration: {formatRelativeTime(number?.activeAssignment?.assignedAt)}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[var(--bg-card-hover)]/40 border border-dashed border-[var(--border-subtle)] text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] flex items-center justify-center mx-auto">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Line Currently Unassigned
              </h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
                This E.164 number is in the available inventory pool and is ready to be mapped to an enterprise customer account.
              </p>
            </div>
            {isAvailable && (
              <Button variant="primary" size="sm" onClick={() => onAssign(number)}>
                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                Allocate Number Now
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Carrier Provider & Operational Ingress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NumberProviderCard
          provider={number.provider}
          country={number.country}
          operator={number.operator}
          range={number.range}
          monthlyCost={number.monthlyCost}
          currency={number.currency}
        />
        <NumberTrafficCard traffic={number.traffic} />
      </div>

      {/* Append-Only Assignment History */}
      <NumberAssignmentHistory histories={number.assignmentHistories} />

      {/* Real-Time Operational Event Timeline */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Operational Activity & Audit Stream
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Audit Trail
          </span>
        </div>

        <div className="space-y-3">
          {Array.isArray(number?.recentActivity) && number.recentActivity.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={act.severity === 'WARNING' ? 'warning' : act.severity === 'ERROR' ? 'error' : 'info'}>
                    {act.action}
                  </Badge>
                  <span className="font-semibold text-[var(--text-primary)]">{act.description}</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                  <span>Actor: {act.actor || 'System'}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(act.timestamp)}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                {formatDate(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
