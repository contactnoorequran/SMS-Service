/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { AgentItem, AgentStatus } from '../../../types/agents';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Users,
  KeyRound,
  Hash,
  CheckCircle2,
} from 'lucide-react';

interface AgentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentItem | null;
  targetStatus: AgentStatus | null;
  onConfirm: (id: string, newStatus: AgentStatus, reason?: string) => Promise<void>;
}

export const AgentStatusModal: React.FC<AgentStatusModalProps> = ({
  isOpen,
  onClose,
  agent,
  targetStatus,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!agent || !targetStatus) return null;

  const isDestructive = targetStatus === 'SUSPENDED' || targetStatus === 'DISABLED';

  const getStatusBadgeVariant = (status: AgentStatus) => {
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
      await onConfirm(agent.id, targetStatus, reason.trim() || undefined);
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
      title={isDestructive ? 'Confirm Agent Account Restriction' : 'Confirm Agent Activation'}
      size="md"
    >
      <div className="space-y-4">
        {/* Status Transition Header */}
        <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Current Status</div>
            <Badge variant={getStatusBadgeVariant(agent.status)} size="md">
              {agent.status}
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

        {/* Target Identity */}
        <div className="text-xs text-[var(--text-secondary)]">
          Modifying commercial privileges for{' '}
          <strong className="text-[var(--text-primary)]">{agent.name}</strong> ({agent.email}).
        </div>

        {/* Operational Impact Disclosure */}
        <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
          <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <AlertTriangle className={`w-4 h-4 ${isDestructive ? 'text-[var(--accent-rose)]' : 'text-[var(--accent-blue)]'}`} />
            <span>Downstream Operational Impacts:</span>
          </div>

          <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
            {targetStatus === 'SUSPENDED' && (
              <>
                <li>Immediate revocation of active web sessions and portal authentication.</li>
                <li>
                  <strong className="text-[var(--text-primary)]">{agent.clientsCount} managed clients</strong> remain in the system, but this agent cannot allocate new numbers or alter rate tiers.
                </li>
                <li>Commission payouts will be held in pending status until reinstated.</li>
                <li>
                  Supervising manager (<strong className="text-[var(--text-primary)]">{agent.managerName || 'Operations'}</strong>) will receive a compliance notification.
                </li>
              </>
            )}
            {targetStatus === 'DISABLED' && (
              <>
                <li>Permanent account deactivation. Credentials will be locked.</li>
                <li>Client portfolio will be marked for managerial re-assignment.</li>
                <li>All pending commission claims will be frozen for audit review.</li>
              </>
            )}
            {targetStatus === 'ACTIVE' && (
              <>
                <li>Restores full commercial agent portal access.</li>
                <li>Allows client onboarding, E.164 number assignment, and commission accrual.</li>
              </>
            )}
          </ul>
        </div>

        {/* Audit Reason */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Audit Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Performance review, portfolio handoff, or manager approval..."
            rows={2}
            className="w-full px-3 py-2 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors resize-none"
          />
        </div>

        {/* Modal Actions */}
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
            {isDestructive ? `Confirm ${targetStatus}` : 'Activate Agent'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
