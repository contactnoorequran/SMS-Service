import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { ManagerListItem } from '../../../types/manager';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerListItem | null;
  targetStatus: 'ACTIVE' | 'SUSPENDED';
  onSubmit: (id: string, status: 'ACTIVE' | 'SUSPENDED', reason: string) => Promise<void>;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  manager,
  targetStatus,
  onSubmit,
}) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!manager) return null;

  const isSuspending = targetStatus === 'SUSPENDED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for this audit event.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(manager.id, targetStatus, reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update manager status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuspending ? 'Suspend Manager Account' : 'Reactivate Manager Account'}
      subtitle={`Change operational access state for ${manager.name} (${manager.username})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.2)] rounded-lg text-xs text-rose-700 text-rose-300">
            {error}
          </div>
        )}

        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isSuspending
              ? 'bg-[var(--accent-rose-dim)] border-[rgba(244,63,94,0.2)]'
              : 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.2)]'
          }`}
        >
          {isSuspending ? (
            <ShieldAlert className="w-5 h-5 text-[var(--accent-rose)] shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <h4
              className={`font-semibold ${
                isSuspending ? 'text-rose-900 text-rose-200' : 'text-emerald-900 text-emerald-200'
              }`}
            >
              {isSuspending ? 'Immediate Access Revocation' : 'Restoration of Operational Privileges'}
            </h4>
            <p
              className={`${
                isSuspending ? 'text-rose-700 text-rose-300' : 'text-[var(--accent-emerald)]'
              }`}
            >
              {isSuspending
                ? 'Suspending this manager will immediately block future logins with an ACCOUNT_SUSPENDED code. Managed agents and clients will remain linked.'
                : 'Reactivating will allow the manager to log in and resume supervisory operations immediately.'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Audit Reason *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isSuspending
                ? 'e.g. Account suspended due to security compliance audit pending review'
                : 'e.g. Account reactivated after security verification completed'
            }
            className="w-full px-3 py-2 text-xs bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] border-[var(--glass-border)] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--glass-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
              isSuspending
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting
              ? 'Processing...'
              : isSuspending
              ? 'Confirm Suspension'
              : 'Confirm Reactivation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
