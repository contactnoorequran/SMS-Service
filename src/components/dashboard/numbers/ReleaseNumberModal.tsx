/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { NumberItem, NumberDetail, ReleaseNumberPayload } from '../../../types/numbers';
import { formatDate, formatRelativeTime } from '../../../utils/formatters';
import { ShieldAlert, AlertTriangle, FileText, CheckCircle2, Hash, PowerOff } from 'lucide-react';

interface ReleaseNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  number: NumberItem | NumberDetail | null;
  onSubmit: (numberId: string, payload: ReleaseNumberPayload) => Promise<void>;
}

export const ReleaseNumberModal: React.FC<ReleaseNumberModalProps> = ({
  isOpen,
  onClose,
  number,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!number || !number.activeAssignment) return null;

  const currentAssignment = number.activeAssignment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(number.id, {
        reason: reason.trim() || 'Client requested decommission/release back to inventory',
        releasedBy: 'admin@smshub.local',
      });
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err?.message || 'Failed to release phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Release Phone Number to Inventory">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Callout */}
        <div className="p-3.5 rounded-xl bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 space-y-2">
          <div className="flex items-center gap-2 text-[var(--accent-rose)] font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Confirm Number Release & Ingress Disconnection</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Releasing <strong className="text-[var(--text-primary)] font-mono">{number.e164}</strong> will terminate active routing to{' '}
            <strong className="text-[var(--text-primary)]">{currentAssignment.client.companyName}</strong>. The line will enter the unallocated available pool.
          </p>
        </div>

        {/* Current Active Assignment Summary */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              Current Active Assignment
            </span>
            <Badge variant="info">ACTIVE</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[var(--text-muted)] block">Client Account:</span>
              <span className="font-semibold text-[var(--text-primary)]">{currentAssignment.client.companyName}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Supervising Agent:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {currentAssignment.agent ? currentAssignment.agent.name : 'Platform Direct'}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Assigned Date:</span>
              <span className="font-mono text-[var(--text-secondary)]">{formatDate(currentAssignment.assignedAt)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Assignment Age:</span>
              <span className="font-mono text-[var(--text-secondary)]">{formatRelativeTime(currentAssignment.assignedAt)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-xs">
            {error}
          </div>
        )}

        {/* Release Reason Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            Audit Reason for Release (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Contract termination, customer non-payment, or pool rotation"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Keep Number Assigned
          </Button>
          <Button variant="danger" size="sm" type="submit" isLoading={isSubmitting}>
            <PowerOff className="w-3.5 h-3.5 mr-1.5" />
            Confirm Release
          </Button>
        </div>
      </form>
    </Modal>
  );
};
