import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { ManagerListItem, PermissionDefinition } from '../../../types/manager';
import { Shield, Check, AlertCircle, Sparkles } from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerListItem | null;
  availablePermissions: PermissionDefinition[];
  onSubmit: (id: string, permissions: string[]) => Promise<void>;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  manager,
  availablePermissions,
  onSubmit,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (manager) {
      setSelectedPermissions(manager.permissions || []);
      setError(null);
    }
  }, [manager]);

  if (!manager) return null;

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

  const applyPreset = (preset: 'standard' | 'readonly' | 'operations') => {
    switch (preset) {
      case 'standard':
        setSelectedPermissions([
          'users.view',
          'users.manage',
          'providers.view',
          'sms.view',
          'reports.view',
        ]);
        break;
      case 'readonly':
        setSelectedPermissions([
          'users.view',
          'providers.view',
          'sms.view',
          'reports.view',
          'billing.view',
        ]);
        break;
      case 'operations':
        setSelectedPermissions([
          'users.view',
          'users.manage',
          'numbers.view',
          'numbers.manage',
          'providers.view',
          'sms.view',
          'billing.view',
          'reports.view',
        ]);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(manager.id, selectedPermissions);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by category
  const groupedPermissions: Record<string, PermissionDefinition[]> = {};
  availablePermissions.forEach((p) => {
    if (!groupedPermissions[p.category]) {
      groupedPermissions[p.category] = [];
    }
    groupedPermissions[p.category].push(p);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Manager Permissions"
      subtitle={`Configure granular operational and data visibility rights for ${manager.name}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Presets & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('standard')}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Standard Manager
            </button>
            <button
              type="button"
              onClick={() => applyPreset('operations')}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Full Operations
            </button>
            <button
              type="button"
              onClick={() => applyPreset('readonly')}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Read-Only Audit
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
            <span className="text-slate-400">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Categorized Permissions Grid */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {category}
                </span>
                <span className="text-[11px] text-slate-400">
                  {perms.filter((p) => selectedPermissions.includes(p.code)).length} of {perms.length} enabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {perms.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.code)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{perm.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({perm.code})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {perm.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            Selected: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPermissions.length}</span> permissions
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Permissions...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
