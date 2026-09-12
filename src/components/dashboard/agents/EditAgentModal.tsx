import React, { useState, useEffect } from 'react';
import { AgentListItem, UpdateAgentDTO } from '../../../types/agent';
import { Modal } from '../../ui/Modal';
import { AlertCircle, UserCheck, Percent } from 'lucide-react';
import { ManagerListItem } from '../../../types/manager';

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentListItem | null;
  onSubmit: (id: string, data: UpdateAgentDTO) => Promise<void>;
  managers: ManagerListItem[];
  currentRole: string;
}

export const EditAgentModal: React.FC<EditAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSubmit,
  managers,
  currentRole,
}) => {
  const [formData, setFormData] = useState<UpdateAgentDTO>({
    firstName: '',
    lastName: '',
    contact: '',
    commissionRate: 0.05,
    managerId: null,
    status: 'ACTIVE',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setFormData({
        firstName: agent.firstName,
        lastName: agent.lastName,
        contact: agent.contact || '',
        commissionRate: agent.commissionRate,
        managerId: agent.managerId,
        status: agent.status,
      });
      setError(null);
    }
  }, [agent]);

  if (!agent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: UpdateAgentDTO = {
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim(),
        contact: formData.contact?.trim(),
        commissionRate: Number(formData.commissionRate),
        status: formData.status,
      };

      if (currentRole === 'SUPER_ADMIN') {
        payload.managerId = formData.managerId || null;
      }

      await onSubmit(agent.id, payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update agent profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Agent: ${agent.name}`}
      subtitle={`Update operational profile, contact parameters, commission rate, and managerial mapping`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Username / Email:</span>
            <div className="font-mono text-slate-500 mt-0.5">{agent.username} • {agent.email}</div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            ID: {agent.id}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              required
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              required
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={formData.contact || ''}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Commission Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.005"
                min="0"
                max="1"
                value={formData.commissionRate || 0}
                onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">
                {((formData.commissionRate || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {currentRole === 'SUPER_ADMIN' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Manager
            </label>
            <select
              value={formData.managerId || ''}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value || null })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned (Direct Super Admin Supervision)</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.department || 'Operations'})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Status
          </label>
          <select
            value={formData.status || 'ACTIVE'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
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
            {isLoading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
