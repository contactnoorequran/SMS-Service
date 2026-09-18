/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CreateAgentPayload, AgentStatus, ManagerSummary } from '../../../types/agents';
import {
  Users,
  KeyRound,
  Mail,
  UserCheck,
  Building,
  Percent,
  AlertCircle,
  Shield,
} from 'lucide-react';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAgentPayload) => Promise<void>;
  managers: ManagerSummary[];
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  managers,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    managerId: managers[0]?.id || '',
    status: 'ACTIVE' as AgentStatus,
    commissionRate: 5,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-transparent' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-[var(--accent-rose)]' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-[var(--accent-amber)]' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-[var(--accent-blue)]' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-[var(--accent-emerald)]' };
      default:
        return { score: 0, label: 'Very Weak', color: 'bg-[var(--accent-rose)]' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Password confirmation is required';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
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
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        managerId: formData.managerId || null,
        status: formData.status,
        role: 'AGENT',
        commissionRate: formData.commissionRate / 100,
      });

      // Clear fields
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        managerId: managers[0]?.id || '',
        status: 'ACTIVE',
        commissionRate: 5,
      });
      setErrors({});
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to create agent profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Agent Profile"
      description="Register a new commercial agent, assign a supervising manager, and set commission rate."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 rounded-xl flex items-center gap-2 text-xs text-[var(--accent-rose)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Full Name <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Liam O’Connor"
              className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                errors.name ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              } rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
            />
            {errors.name && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Email Address <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="liam.o@smshub.local"
              className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                errors.email ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              } rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
            />
            {errors.email && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Password <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
              autoComplete="new-password"
              className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                errors.password ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              } rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
            />
            {errors.password && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.password}</p>}

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[var(--text-muted)]">Strength:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{passwordStrength.label}</span>
                </div>
                <div className="w-full h-1 bg-[var(--bg-glass-card)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Confirm Password <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••••••"
              autoComplete="new-password"
              className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                errors.confirmPassword ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              } rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Manager & Commission Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  disabled={m.availableSlots <= 0}
                  className="bg-[var(--bg-card)] text-[var(--text-primary)]"
                >
                  {m.name} ({m.department}) — {m.availableSlots} slots left
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Agents report to Managers in the platform hierarchy.
            </p>
          </div>

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
        </div>

        {/* Initial Status & Role Confirmation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Initial Account Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AgentStatus })}
              className="w-full px-3 py-2 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            >
              <option value="ACTIVE" className="bg-[var(--bg-card)] text-[var(--text-primary)]">ACTIVE</option>
              <option value="PENDING" className="bg-[var(--bg-card)] text-[var(--text-primary)]">PENDING</option>
              <option value="SUSPENDED" className="bg-[var(--bg-card)] text-[var(--text-primary)]">SUSPENDED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Platform Hierarchy Role
            </label>
            <div className="px-3 py-2 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-sm">
              <span className="text-[var(--text-primary)] font-medium">AGENT</span>
              <Badge variant="purple" size="sm">Fixed Hierarchy</Badge>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)] mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Agent
          </Button>
        </div>
      </form>
    </Modal>
  );
};
