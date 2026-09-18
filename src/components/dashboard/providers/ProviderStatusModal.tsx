/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProviderItem, ProviderDetail, ProviderStatus } from '../../../types/providers';
import {
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Radio,
  Server,
  Hash,
  Activity,
} from 'lucide-react';

interface ProviderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderItem | ProviderDetail | null;
  targetStatus: ProviderStatus | null;
  onConfirm: (id: string, newStatus: ProviderStatus, reason?: string) => Promise<void>;
}

export const ProviderStatusModal: React.FC<ProviderStatusModalProps> = ({
  isOpen,
  onClose,
  provider,
  targetStatus,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!provider || !targetStatus) return null;

  const isSuspending = targetStatus === 'SUSPENDED' || targetStatus === 'INACTIVE';

  const getStatusBadgeVariant = (status: ProviderStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'neutral';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(provider.id, targetStatus, reason.trim() || undefined);
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
      title={isSuspending ? 'Confirm Carrier Trunk Suspension' : 'Confirm Carrier Trunk Activation'}
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Transition Badges */}
        <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Current:</span>
            <Badge variant={getStatusBadgeVariant(provider.status)} size="sm">
              {provider.status}
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

        {/* Carrier Details */}
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1 text-xs">
          <div className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-[var(--accent-blue)]" />
            <span>{provider.name}</span>
          </div>
          <div className="text-[var(--text-muted)]">
            Type: {provider.type} • Active Binds: {provider.healthyConnectionsCount}/{provider.connectionsCount}
          </div>
          <div className="text-[var(--text-muted)] font-mono text-[11px]">
            ID: {provider.id} • Assigned DIDs: {provider.assignedNumbersCount} numbers
          </div>
        </div>

        {/* Operational Impact Warning */}
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
            <span>{isSuspending ? 'Immediate Carrier Routing Impacts:' : 'Trunk Restoration Impacts:'}</span>
          </div>

          <ul className="space-y-1.5 pl-6 list-disc text-[11px] text-[var(--text-secondary)]">
            {isSuspending ? (
              <>
                <li>
                  <strong>Dynamic Failover:</strong> Outbound message queues will bypass this carrier and automatically reroute to secondary providers according to priority weight.
                </li>
                <li>
                  <strong>Socket Binds Suspended:</strong> Active SMPP transmitter and transceiver sockets will unbind gracefully.
                </li>
                <li>
                  <strong>Number Ingress Interruption:</strong> Inbound SMS directed to the {provider.assignedNumbersCount} numbers hosted on this trunk will be held or dropped until re-activation.
                </li>
                <li>
                  <strong>Health Polling Paused:</strong> Real-time latency watchdog checks will be muted for this provider.
                </li>
              </>
            ) : (
              <>
                <li>
                  <strong>Socket Binds Restored:</strong> SMPP socket reconnect loops will initiate and establish TLS handshake.
                </li>
                <li>
                  <strong>Traffic Weight Restored:</strong> The carrier will re-enter the primary LCR (Least Cost Routing) matrix.
                </li>
                <li>
                  <strong>Inbound Ingress Resumed:</strong> Callbacks and DLR receipts will process immediately.
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
                ? 'e.g. Scheduled carrier core maintenance, optical cut reported by NOC, or degraded delivery ratios...'
                : 'e.g. Carrier maintenance window concluded, socket latency verified under 40ms...'
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
            {isSuspending ? 'Confirm Trunk Suspension' : 'Confirm Trunk Activation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
