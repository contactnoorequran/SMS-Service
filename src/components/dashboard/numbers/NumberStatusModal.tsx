/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { NumberItem, NumberDetail, NumberStatus } from '../../../types/numbers';
import { ShieldAlert, ArrowRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NumberStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  number: NumberItem | NumberDetail | null;
  targetStatus: NumberStatus | null;
  onConfirm: (numberId: string, newStatus: NumberStatus, reason?: string) => Promise<void>;
}

export const NumberStatusModal: React.FC<NumberStatusModalProps> = ({
  isOpen,
  onClose,
  number,
  targetStatus,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!number || !targetStatus) return null;

  const isSuspending = targetStatus === 'SUSPENDED';
  const isDecommissioning = targetStatus === 'DECOMMISSIONED';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(number.id, targetStatus, reason.trim() || undefined);
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err?.message || 'Failed to update phone number status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuspending ? 'Suspend Phone Number Routing' : isDecommissioning ? 'Decommission Phone Number' : 'Update Number Status'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Transition Header */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{number.e164}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(number.status)}>{number.status}</Badge>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <Badge variant={getStatusBadgeVariant(targetStatus)}>{targetStatus}</Badge>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-xs">
            {error}
          </div>
        )}

        {/* Operational Impact Notice */}
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
            isSuspending || isDecommissioning
              ? 'bg-[var(--accent-rose-dim)] border-[var(--accent-rose)]/30 text-[var(--text-secondary)]'
              : 'bg-[var(--accent-emerald-dim)] border-[var(--accent-emerald)]/30 text-[var(--text-secondary)]'
          }`}
        >
          {isSuspending || isDecommissioning ? (
            <ShieldAlert className="w-4 h-4 text-[var(--accent-rose)] shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-semibold text-[var(--text-primary)] block">
              {isSuspending
                ? 'Operational Suspension Impact'
                : isDecommissioning
                ? 'Permanent Decommissioning Impact'
                : 'Status Transition Summary'}
            </span>
            <p className="text-[11px] leading-relaxed">
              {isSuspending && (
                <>
                  Inbound SMS routing will be held immediately at the carrier gateway layer. The assigned client (
                  {number.activeAssignment ? number.activeAssignment.client.companyName : 'None'}) will temporarily cease receiving message delivery reports until restored.
                </>
              )}
              {isDecommissioning && (
                <>
                  This line will be permanently marked as decommissioned. Upstream binds will be decommissioned and the number will not be available for future assignment.
                </>
              )}
              {!isSuspending && !isDecommissioning && (
                <>
                  This number will transition to {targetStatus}. Operational dispatch queues and telemetry polling will adjust accordingly.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Reason Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Audit Reason for Status Transition
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Regulatory compliance hold, spam prevention, or carrier maintenance"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={isSuspending || isDecommissioning ? 'danger' : 'primary'}
            size="sm"
            type="submit"
            isLoading={isSubmitting}
          >
            Confirm Status Change
          </Button>
        </div>
      </form>
    </Modal>
  );
};
