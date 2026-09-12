import React, { useState, useEffect } from 'react';
import { AgentListItem } from '../../../types/agent';
import { Modal } from '../../ui/Modal';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface AgentPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentListItem | null;
  availablePermissions: Array<{ code: string; module: string; description: string }>;
  onSubmit: (id: string, permissions: string[]) => Promise<void>;
}

export const AgentPermissionsModal: React.FC<AgentPermissionsModalProps> = ({
  isOpen,
  onClose,
  agent,
  availablePermissions,
  onSubmit,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setSelectedPermissions(agent.permissions || []);
      setError(null);
    }
  }, [agent]);

  if (!agent) return null;

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(availablePermissions.map((p) => p.code));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit(agent.id, selectedPermissions);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update agent permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Group permissions by module
  const grouped: Record<string, Array<{ code: string; module: string; description: string }>> = {};
  for (const curr of availablePermissions) {
    if (!grouped[curr.module]) {
      grouped[curr.module] = [];
    }
    grouped[curr.module].push(curr);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Permissions: ${agent.name}`}
      subtitle={`Assign or revoke granular API and system privileges for agent ${agent.username}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Active Grants: {selectedPermissions.length} of {availablePermissions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-slate-500 hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
          {Object.entries(grouped).map(([module, perms]) => (
            <div key={module} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {module}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perms.map((p) => {
                  const isChecked = selectedPermissions.includes(p.code);
                  return (
                    <label
                      key={p.code}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(p.code)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-bold">{p.code}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                          {p.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
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
            {isLoading ? 'Saving...' : 'Update Permissions'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
