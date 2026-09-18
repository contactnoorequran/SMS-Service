/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ManagerItem, UpdateManagerPayload, ManagerStatus } from '../../../types/managers';
import { Building, Lock, AlertCircle, Users } from 'lucide-react';

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerItem | null;
  onSubmit: (id: string, payload: UpdateManagerPayload) => Promise<void>;
  departments: string[];
}

export const EditManagerModal: React.FC<EditManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  onSubmit,
  departments,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    maxAgents: 10,
    status: 'ACTIVE' as ManagerStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (manager) {
      setFormData({
        name: manager.name,
        department: manager.department,
        maxAgents: manager.maxAgents,
        status: manager.status,
      });
      setErrors({});
    }
  }, [manager]);

  if (!manager) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    if (!formData.department.trim()) {
      errs.department = 'Department is required';
    }

    if (formData.maxAgents === undefined || formData.maxAgents < 0 || isNaN(formData.maxAgents)) {
      errs.maxAgents = 'Maximum agents must be a non-negative number';
    } else if (formData.maxAgents < manager.assignedAgentsCount) {
      errs.maxAgents = `Cannot reduce capacity below currently assigned agents (${manager.assignedAgentsCount})`;
    } else if (formData.maxAgents > 100) {
      errs.maxAgents = 'Maximum agents capacity cannot exceed 100';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(manager.id, {
        name: formData.name.trim(),
        department: formData.department.trim(),
        maxAgents: Number(formData.maxAgents),
        status: formData.status,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to update manager profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Manager Profile"
      description={`Update settings and quota configuration for ${manager.name}.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 rounded-xl flex items-center gap-2 text-xs text-[var(--accent-rose)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Read-Only Identity / Email */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Email Address (Immutable Identity)
          </label>
          <div className="px-3 py-2 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)] font-mono">{manager.email}</span>
            <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Locked</span>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Full Name <span className="text-[var(--accent-rose)]">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
              errors.name ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
            } rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
          />
          {errors.name && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.name}</p>}
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Department <span className="text-[var(--accent-rose)]">*</span>
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
              errors.department ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
            } rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
          />
          {errors.department && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.department}</p>}
        </div>

        {/* Maximum Agent Capacity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Maximum Agent Capacity <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <span className="text-[11px] text-[var(--text-muted)]">
              Currently Assigned: <strong className="text-[var(--text-primary)]">{manager.assignedAgentsCount}</strong>
            </span>
          </div>
          <input
            type="number"
            min={manager.assignedAgentsCount}
            max="100"
            value={formData.maxAgents}
            onChange={(e) => setFormData({ ...formData, maxAgents: parseInt(e.target.value, 10) || 0 })}
            className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
              errors.maxAgents ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
            } rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
          />
          {errors.maxAgents && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.maxAgents}</p>}
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Account Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ManagerStatus })}
            className="w-full px-3 py-2 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          >
            <option value="ACTIVE" className="bg-[var(--bg-card)] text-[var(--text-primary)]">ACTIVE</option>
            <option value="PENDING" className="bg-[var(--bg-card)] text-[var(--text-primary)]">PENDING</option>
            <option value="SUSPENDED" className="bg-[var(--bg-card)] text-[var(--text-primary)]">SUSPENDED</option>
            <option value="DISABLED" className="bg-[var(--bg-card)] text-[var(--text-primary)]">DISABLED</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)] mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
