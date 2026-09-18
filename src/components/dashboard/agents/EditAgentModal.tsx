/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { AgentItem, UpdateAgentPayload, AgentStatus, ManagerSummary } from '../../../types/agents';
import { Lock, Building, AlertCircle, Users } from 'lucide-react';

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentItem | null;
  onSubmit: (id: string, payload: UpdateAgentPayload) => Promise<void>;
  managers: ManagerSummary[];
}

export const EditAgentModal: React.FC<EditAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSubmit,
  managers,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    managerId: '',
    status: 'ACTIVE' as AgentStatus,
    commissionRate: 5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        managerId: agent.managerId || '',
        status: agent.status,
        commissionRate: agent.commissionRate ? Math.round(agent.commissionRate * 100) : 5,
      });
      setErrors({});
    }
  }, [agent]);

  if (!agent) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    if (formData.commissionRate < 0 || formData.commissionRate > 50 || isNaN(formData.commissionRate)) {
      errs.commissionRate = 'Commission rate must be between 0% and 50%';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(agent.id, {
        name: formData.name.trim(),
        managerId: formData.managerId || null,
        status: formData.status,
        commissionRate: formData.commissionRate / 100,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to update agent profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Agent Profile"
      description={`Update configuration and supervisor assignment for ${agent.name}.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 rounded-xl flex items-center gap-2 text-xs text-[var(--accent-rose)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Read-Only Email */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Email Address (Immutable Identity)
          </label>
          <div className="px-3 py-2 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)] font-mono">{agent.email}</span>
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

        {/* Supervising Manager */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Supervising Manager
          </label>
          <select
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          >
            <option value="" className="bg-[var(--bg-card)] text-[var(--text-muted)]">
              -- Unassigned (Direct Pool) --
            </option>
            {managers.map((m) => (
              <option
                key={m.id}
                value={m.id}
                className="bg-[var(--bg-card)] text-[var(--text-primary)]"
              >
                {m.name} ({m.department})
              </option>
            ))}
          </select>
        </div>

        {/* Commission Rate */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Commission Rate (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
              className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                errors.commissionRate ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              } rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-mono">
              %
            </span>
          </div>
          {errors.commissionRate && (
            <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.commissionRate}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Account Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AgentStatus })}
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
