import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { UserItem, UserStatus } from '../../../types/users';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface UserStatusModalProps {
  isOpen: boolean;
  user: UserItem | null;
  targetStatus: UserStatus | null;
  onClose: () => void;
  onConfirm: (id: string, status: UserStatus, reason?: string) => Promise<void>;
}

export const UserStatusModal: React.FC<UserStatusModalProps> = ({
  isOpen,
  user,
  targetStatus,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || !targetStatus) return null;

  const isDestructive = targetStatus === 'SUSPENDED' || targetStatus === 'DISABLED';

  const getStatusBadgeVariant = (s: UserStatus) => {
    switch (s) {
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

  const getImpactDescription = () => {
    switch (targetStatus) {
      case 'SUSPENDED':
        return 'Suspending this account will immediately terminate all active authenticated sessions, freeze prepaid wallet debits, and reject inbound API requests with HTTP 403 Forbidden.';
      case 'DISABLED':
        return 'Disabling this identity will permanently deactivate login capabilities and release all temporary number routing queues.';
      case 'ACTIVE':
        return 'Activating this account will restore access to platform portals, re-enable routing pipelines, and authorize API token operations according to their assigned RBAC permissions.';
      case 'PENDING':
        return 'Setting this account to pending will hold identity authentication until an administrator re-verifies verification documentation.';
      default:
        return 'Changing account status affects access permissions across all SMS platform services.';
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(user.id, targetStatus, reason.trim() || undefined);
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
      title="Confirm Account Status Change"
      subtitle={`Lifecycle state transition for ${user.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* User Identity Banner */}
        <div className="p-3.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--glass-bg-active)] text-[var(--accent-blue)] font-bold flex items-center justify-center text-xs shrink-0">
              {user.name[0] || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.name}</div>
              <div className="text-[11px] font-mono text-[var(--text-tertiary)] truncate">{user.email}</div>
            </div>
          </div>
          <Badge variant="neutral" size="sm">
            {user.role.displayName}
          </Badge>
        </div>

        {/* Transition State Visualization */}
        <div className="p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] flex items-center justify-center gap-4">
          <div className="text-center">
            <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">Current State</span>
            <Badge variant={getStatusBadgeVariant(user.status)} size="sm">
              {user.status}
            </Badge>
          </div>

          <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] mt-3" />

          <div className="text-center">
            <span className="text-[10px] text-[var(--text-tertiary)] block mb-1">Requested State</span>
            <Badge variant={getStatusBadgeVariant(targetStatus)} size="sm">
              {targetStatus}
            </Badge>
          </div>
        </div>

        {/* Impact Warning */}
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
            isDestructive
              ? 'bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.25)] text-[var(--accent-rose)]'
              : 'bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.25)] text-[var(--accent-emerald)]'
          }`}
        >
          {isDestructive ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold mb-0.5">Operational Impact</div>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              {getImpactDescription()}
            </p>
          </div>
        </div>

        {/* Optional Audit Reason */}
        <div>
          <label htmlFor="status-reason" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Audit Reason (Optional)
          </label>
          <input
            id="status-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Administrative compliance review or security hold"
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            {isDestructive ? `Confirm ${targetStatus}` : `Activate Account`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
