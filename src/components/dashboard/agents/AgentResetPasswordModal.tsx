import React, { useState } from 'react';
import { AgentListItem } from '../../../types/agent';
import { Modal } from '../../ui/Modal';
import { KeyRound, Copy, Check, AlertCircle, ShieldAlert } from 'lucide-react';

interface AgentResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentListItem | null;
  onSubmit: (id: string, options: { newPassword?: string; autoGenerate?: boolean }) => Promise<{ temporaryPassword?: string }>;
}

export const AgentResetPasswordModal: React.FC<AgentResetPasswordModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSubmit,
}) => {
  const [autoGenerate, setAutoGenerate] = useState<boolean>(true);
  const [customPassword, setCustomPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!agent) return null;

  const resetState = () => {
    setAutoGenerate(true);
    setCustomPassword('');
    setError(null);
    setTemporaryPassword(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await onSubmit(agent.id, {
        autoGenerate,
        newPassword: !autoGenerate ? customPassword : undefined,
      });

      if (res?.temporaryPassword) {
        setTemporaryPassword(res.temporaryPassword);
      } else if (!autoGenerate && customPassword) {
        setTemporaryPassword(customPassword);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset agent password.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Reset Password: ${agent.name}`}
      subtitle="Issue a new cryptographic password hash and generate temporary credentials"
      maxWidth="md"
    >
      {temporaryPassword ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" />
              Password Successfully Reset
            </div>
            <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
              The agent's credentials have been replaced in the database.
            </p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Temporary Access Key
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(temporaryPassword)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-300 hover:bg-amber-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-slate-100 select-all border border-amber-200 dark:border-amber-800">
              {temporaryPassword}
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              Please share this temporary password securely with {agent.email}. It will not be shown again.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200">{agent.name}</div>
            <div className="text-slate-500 font-mono text-[11px] mt-0.5">{agent.email}</div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold">Auto-generate a secure random 16-character password</span>
            </label>

            {!autoGenerate && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specify New Password *
                </label>
                <input
                  type="password"
                  required={!autoGenerate}
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              {isLoading ? 'Resetting...' : 'Execute Password Reset'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
