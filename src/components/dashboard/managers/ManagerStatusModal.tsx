/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ManagerItem, ManagerStatus } from '../../../types/managers';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Users,
  KeyRound,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface ManagerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerItem | null;
  targetStatus: ManagerStatus | null;
  onConfirm: (id: string, newStatus: ManagerStatus, reason?: string) => Promise<void>;
}

export const ManagerStatusModal: React.FC<ManagerStatusModalProps> = ({
  isOpen,
  onClose,
  manager,
  targetStatus,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!manager || !targetStatus) return null;

  const isDestructive = targetStatus === 'SUSPENDED' || targetStatus === 'DISABLED';

  const getStatusBadgeVariant = (status: ManagerStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'SUSPENDED':
      case 'DISABLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(manager.id, targetStatus, reason.trim() || undefined);
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDestructive ? 'Confirm Manager Account Restriction' : 'Confirm Manager Activation'}
      size="md"
    >
      <div className="space-y-4">
        {/* Status Transition Header */}
        <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Current Status</div>
            <Badge variant={getStatusBadgeVariant(manager.status)} size="md">
              {manager.status}
            </Badge>
          </div>

          <div className="flex items-center text-[var(--text-muted)]">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Requested Status</div>
            <Badge variant={getStatusBadgeVariant(targetStatus)} size="md">
              {targetStatus}
            </Badge>
          </div>
        </div>

        {/* Manager Target Summary */}
        <div className="text-xs text-[var(--text-secondary)]">
          Modifying operational privileges for{' '}
          <strong className="text-[var(--text-primary)]">{manager.name}</strong> ({manager.email}).
        </div>

        {/* Operational Impact Warnings */}
        <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
          <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <AlertTriangle className={`w-4 h-4 ${isDestructive ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-blue)]'}`} />
            <span>Downstream Operational Impacts:</span>
          </div>

          <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
            {targetStatus === 'SUSPENDED' && (
              <>
                <li>Immediate termination of active web sessions and revocation of JWT tokens.</li>
                <li>
                  <strong className="text-[var(--text-primary)]">{manager.assignedAgentsCount} currently assigned agents</strong> will remain linked, but the manager cannot perform administrative approvals.
                </li>
                <li>API keys and webhook endpoints under this manager will be temporarily blocked.</li>
              </>
            )}
            {targetStatus === 'DISABLED' && (
              <>
                <li>Permanent deactivation of manager portal authentication.</li>
                <li>Re-assignment of all {manager.assignedAgentsCount} active agents will be recommended.</li>
                <li>All pending invitations and invitations sent by this manager will be invalidated.</li>
              </>
            )}
            {targetStatus === 'ACTIVE' && (
              <>
                <li>Restores complete access to the Manager management portal.</li>
                <li>Enables agent supervision, rate management, and report generation according to assigned permissions.</li>
              </>
            )}
          </ul>
        </div>

        {/* Reason for change */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Audit Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scheduled rotation, compliance audit, or department restructuring..."
            rows={2}
            className="w-full px-3 py-2 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            {isDestructive ? `Confirm ${targetStatus}` : 'Activate Manager'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
