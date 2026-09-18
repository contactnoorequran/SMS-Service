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
          <div className="p-3 bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.2)] rounded-lg text-xs text-rose-700 text-rose-300">
            {error}
          </div>
        )}

        {/* Presets & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-blue)]" />
            <span className="font-medium text-[var(--text-secondary)]">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('standard')}
              className="px-2 py-1 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] transition-colors"
            >
              Standard Manager
            </button>
            <button
              type="button"
              onClick={() => applyPreset('operations')}
              className="px-2 py-1 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] transition-colors"
            >
              Full Operations
            </button>
            <button
              type="button"
              onClick={() => applyPreset('readonly')}
              className="px-2 py-1 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] transition-colors"
            >
              Read-Only Audit
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[var(--accent-blue)] hover:underline"
            >
              Select All
            </button>
            <span className="text-[var(--text-tertiary)]">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[var(--text-secondary)] hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Categorized Permissions Grid */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="border border-[var(--glass-border)] rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  {category}
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
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
                          ? 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.2)]/60'
                          : 'bg-[var(--glass-bg)] backdrop-blur-md border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm.code)}
                        className="mt-0.5 rounded border-[var(--glass-border)] text-[var(--accent-blue)] focus:ring-blue-500"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span>{perm.name}</span>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">({perm.code})</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
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

        <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
          <div className="text-xs text-[var(--text-secondary)]">
            Selected: <span className="font-semibold text-[var(--text-primary)]">{selectedPermissions.length}</span> permissions
          </div>
          <div className="flex items-center gap-3">
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
