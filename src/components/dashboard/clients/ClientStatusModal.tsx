/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ClientItem, ClientDetail, ClientStatus } from '../../../types/clients';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Radio,
  Hash,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

interface ClientStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientItem | ClientDetail | null;
  targetStatus: ClientStatus | null;
  onConfirm: (id: string, newStatus: ClientStatus, reason?: string) => Promise<void>;
}

export const ClientStatusModal: React.FC<ClientStatusModalProps> = ({
  isOpen,
  onClose,
  client,
  targetStatus,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!client || !targetStatus) return null;

  const isSuspending = targetStatus === 'SUSPENDED' || targetStatus === 'DISABLED';

  const getStatusBadgeVariant = (status: ClientStatus) => {
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
      await onConfirm(client.id, targetStatus, reason.trim() || undefined);
      setReason('');
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuspending ? 'Confirm Account Suspension' : 'Confirm Account Activation'}
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Status Transition Badges */}
        <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Current:</span>
            <Badge variant={getStatusBadgeVariant(client.status)} size="sm">
              {client.status}
            </Badge>
          </div>

          <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Target:</span>
            <Badge variant={getStatusBadgeVariant(targetStatus)} size="sm">
              {targetStatus}
            </Badge>
          </div>
        </div>

        {/* Client Target Details */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 text-xs">
          <div className="font-semibold text-[var(--text-primary)] text-sm">{client.companyName}</div>
          <div className="text-[var(--text-muted)]">Contact: {client.name} • {client.email}</div>
          <div className="text-[var(--text-muted)] font-mono text-[11px]">
            ID: {client.id} • Assigned Agent: {client.agentName || 'Platform Direct'}
          </div>
        </div>

        {/* Operational Impact Warnings */}
        <div
          className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
            isSuspending
              ? 'bg-[var(--accent-rose-dim)] border-[var(--accent-rose)]/30 text-[var(--text-primary)]'
              : 'bg-[var(--accent-emerald-dim)] border-[var(--accent-emerald)]/30 text-[var(--text-primary)]'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {isSuspending ? (
              <ShieldAlert className="w-4 h-4 text-[var(--accent-rose)] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)] shrink-0" />
            )}
            <span>{isSuspending ? 'Immediate Operational Impacts:' : 'Restoration Impacts:'}</span>
          </div>

          <ul className="space-y-1.5 pl-6 list-disc text-[11px] text-[var(--text-secondary)]">
            {isSuspending ? (
              <>
                <li>
                  <strong>Session & Portal Access:</strong> Client portal sessions will be invalidated immediately. API keys will return HTTP 403 Forbidden.
                </li>
                <li>
                  <strong>SMS Dispatch Pipeline:</strong> Outbound messaging queues for this account will freeze; carrier dispatching halted.
                </li>
                <li>
                  <strong>Inbound Routing Callbacks:</strong> Inbound webhooks for allocated numbers will be paused.
                </li>
                <li>
                  <strong>Number Inventory Hold:</strong> {client.assignedNumbersCount || 0} assigned E.164 phone numbers remain allocated but incoming traffic is dropped.
                </li>
              </>
            ) : (
              <>
                <li>
                  <strong>Full Service Restored:</strong> Client portal credentials and API token authentication will be reactivated.
                </li>
                <li>
                  <strong>Dispatch Resumed:</strong> Message queues will immediately start dispatching pending SMS traffic.
                </li>
                <li>
                  <strong>Ingress Activated:</strong> Inbound phone callbacks and webhooks will begin streaming again.
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Audit Reason Input */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Reason for Lifecycle Status Change (Audit Trail)
          </label>
          <textarea
            rows={2}
            placeholder={
              isSuspending
                ? 'e.g. Compliance review required, KYC document expired, or unpaid postpaid invoice...'
                : 'e.g. Verification completed, invoice settled, or identity confirmed...'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isSuspending ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            {isSuspending ? 'Confirm Suspension' : 'Confirm Activation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
