import React, { useState } from 'react';
import { AgentListItem } from '../../../types/agent';
import { Modal } from '../../ui/Modal';
import { AlertCircle, Power, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AgentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentListItem | null;
  targetStatus: 'ACTIVE' | 'SUSPENDED';
  onSubmit: (id: string, status: 'ACTIVE' | 'SUSPENDED', reason: string) => Promise<void>;
}

export const AgentStatusModal: React.FC<AgentStatusModalProps> = ({
  isOpen,
  onClose,
  agent,
  targetStatus,
  onSubmit,
}) => {
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!agent) return null;

  const isEnabling = targetStatus === 'ACTIVE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnabling && !reason.trim()) {
      setError('A reason must be provided when suspending an agent account.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await onSubmit(agent.id, targetStatus, reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update agent status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEnabling ? `Activate Agent Account` : `Suspend Agent Account`}
      subtitle={`Enforce access control state changes for ${agent.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            isEnabling
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {isEnabling ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-sm">
              {isEnabling ? 'Restore Agent Access' : 'Immediate Session Suspension'}
            </div>
            <p className="mt-1 leading-relaxed">
              {isEnabling
                ? `Activating ${agent.name} will restore authentication permissions, allowing this agent to log in and manage allocated clients.`
                : `Suspending ${agent.name} will immediately block new session tokens and reject API requests for this account.`}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {isEnabling ? 'Activation Notes (Optional)' : 'Suspension Reason *'}
          </label>
          <textarea
            rows={3}
            required={!isEnabling}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isEnabling
                ? 'e.g. Account reinstated after compliance audit.'
                : 'e.g. Suspended due to suspected policy breach or managerial directive.'
            }
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-5 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors ${
              isEnabling ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isLoading ? 'Processing...' : isEnabling ? 'Activate Agent' : 'Suspend Agent'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
