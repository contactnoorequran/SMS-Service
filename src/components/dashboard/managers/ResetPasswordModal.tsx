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
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  Password Reset Successfully
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  An immutable MANAGER_PASSWORD_RESET audit log was created.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              New Temporary Password
            </div>
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-950 rounded-lg font-mono text-sm">
              <span className="text-emerald-400 font-bold select-all tracking-wider">
                {temporaryPassword}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs inline-flex items-center gap-1 transition-colors"
                title="Copy Password"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
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
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1">
            <div className="text-slate-500">Target Account</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{manager.name}</div>
            <div className="font-mono text-[11px] text-slate-500">{manager.email}</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="reset-auto"
                name="resetType"
                checked={autoGenerate}
                onChange={() => setAutoGenerate(true)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="reset-auto" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
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
                className="text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="reset-manual" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
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
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
