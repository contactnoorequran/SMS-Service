import React, { useState, useEffect } from 'react';
import { AgentListItem } from '../../../types/agent';
import { Modal } from '../../ui/Modal';
import { UserCheck, AlertCircle, Building, ShieldCheck } from 'lucide-react';
import { ManagerListItem } from '../../../types/manager';

interface AssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentListItem | null;
  managers: ManagerListItem[];
  onSubmit: (id: string, managerId: string | null) => Promise<void>;
}

export const AssignManagerModal: React.FC<AssignManagerModalProps> = ({
  isOpen,
  onClose,
  agent,
  managers,
  onSubmit,
}) => {
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setSelectedManagerId(agent.managerId || '');
      setError(null);
    }
  }, [agent]);

  if (!agent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit(agent.id, selectedManagerId || null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reassign manager.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Manager: ${agent.name}`}
      subtitle="Reallocate supervisory hierarchy and department grouping"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Agent:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{agent.name}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-slate-500">
            <span>Current Assignment:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{agent.managerName || 'Unassigned'}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Select Supervisory Manager *
          </label>
          <select
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned (Direct Super Admin Supervision)</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.department || 'Operations'} ({m.email})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Agents inherit routing supervision and departmental tiering based on their assigned manager.
          </p>
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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            {isLoading ? 'Saving...' : 'Update Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
