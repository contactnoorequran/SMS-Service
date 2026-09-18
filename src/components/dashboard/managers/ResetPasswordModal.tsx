import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { ManagerListItem } from '../../../types/manager';
import { KeyRound, Copy, Check, AlertCircle, ShieldAlert } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerListItem | null;
  onSubmit: (id: string, options: { newPassword?: string; autoGenerate?: boolean }) => Promise<{ temporaryPassword?: string }>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  manager,
  onSubmit,
}) => {
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [customPassword, setCustomPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!manager) return null;

  const handleClose = () => {
    setAutoGenerate(true);
    setCustomPassword('');
    setError(null);
    setTemporaryPassword(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!autoGenerate && (!customPassword || customPassword.length < 8)) {
      setError('Custom password must contain at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit(manager.id, {
        autoGenerate,
        newPassword: autoGenerate ? undefined : customPassword,
      });

      setTemporaryPassword(res?.temporaryPassword || customPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!temporaryPassword) return;
    navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Manager Password"
      subtitle={`Generate secure credentials for ${manager.name} (${manager.username})`}
      maxWidth="md"
    >
      {temporaryPassword ? (
        <div className="space-y-4">
          <div className="p-4 bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.2)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-emerald-900 text-emerald-200">
                  Password Reset Successfully
                </h4>
                <p className="text-[11px] text-[var(--accent-emerald)]">
                  An immutable MANAGER_PASSWORD_RESET audit log was created.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl space-y-2">
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
              New Temporary Password
            </div>
            <div className="flex items-center justify-between gap-2 p-2 bg-[rgba(0,0,0,0.4)] rounded-lg font-mono text-sm">
              <span className="text-[var(--accent-emerald)] font-bold select-all tracking-wider">
                {temporaryPassword}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-primary)] rounded text-xs inline-flex items-center gap-1 transition-colors"
                title="Copy Password"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-[var(--accent-amber-dim)] border border-[rgba(245,158,11,0.2)] rounded-lg text-xs text-[var(--accent-amber)] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This password will not be shown again. Deliver it securely to the manager. Existing active sessions have been invalidated.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.2)] rounded-lg flex items-center gap-2 text-xs text-rose-700 text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-xs space-y-1">
            <div className="text-[var(--text-secondary)]">Target Account</div>
            <div className="font-semibold text-[var(--text-primary)]">{manager.name}</div>
            <div className="font-mono text-[11px] text-[var(--text-secondary)]">{manager.email}</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="reset-auto"
                name="resetType"
                checked={autoGenerate}
                onChange={() => setAutoGenerate(true)}
                className="text-[var(--accent-blue)] focus:ring-blue-500"
              />
              <label htmlFor="reset-auto" className="text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
                Auto-generate cryptographically secure password (Recommended)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="reset-manual"
                name="resetType"
                checked={!autoGenerate}
                onChange={() => setAutoGenerate(false)}
                className="text-[var(--accent-blue)] focus:ring-blue-500"
              />
              <label htmlFor="reset-manual" className="text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
                Specify manual temporary password
              </label>
            </div>

            {!autoGenerate && (
              <div className="pl-6 pt-1">
                <input
                  type="password"
                  placeholder="Enter new password (min 8 characters)"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] border-[var(--glass-border)] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--glass-border)]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Resetting Password...' : 'Execute Password Reset'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
