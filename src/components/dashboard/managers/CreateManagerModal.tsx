/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CreateManagerPayload, ManagerStatus } from '../../../types/managers';
import {
  UserCheck,
  Shield,
  KeyRound,
  Mail,
  Building,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface CreateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateManagerPayload) => Promise<void>;
  departments: string[];
}

export const CreateManagerModal: React.FC<CreateManagerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: departments[0] || 'Operations',
    customDepartment: '',
    maxAgents: 10,
    status: 'ACTIVE' as ManagerStatus,
  });

  const [useCustomDepartment, setUseCustomDepartment] = useState(false);
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

    const effectiveDept = useCustomDepartment ? formData.customDepartment : formData.department;
    if (!effectiveDept || !effectiveDept.trim()) {
      errs.department = 'Department is required';
    }

    if (formData.maxAgents === undefined || formData.maxAgents < 0 || isNaN(formData.maxAgents)) {
      errs.maxAgents = 'Maximum agents must be a non-negative number';
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
      const effectiveDept = useCustomDepartment ? formData.customDepartment.trim() : formData.department;
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        department: effectiveDept,
        maxAgents: Number(formData.maxAgents),
        status: formData.status,
        role: 'MANAGER',
      });

      // Clear sensitive fields and close
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: departments[0] || 'Operations',
        customDepartment: '',
        maxAgents: 10,
        status: 'ACTIVE',
      });
      setErrors({});
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to create manager' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Manager Profile"
      description="Register a new management user with agent oversight quota and department assignment."
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
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Khan"
                className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                  errors.name ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                } rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
              />
            </div>
            {errors.name && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Email Address <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="s.khan@smshub.local"
                className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                  errors.email ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                } rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
              />
            </div>
            {errors.email && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Passwords */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Password <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
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
            </div>
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
            <div className="relative">
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
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Department & Maximum Agents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Department <span className="text-[var(--accent-rose)]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setUseCustomDepartment(!useCustomDepartment)}
                className="text-[10px] text-[var(--accent-blue)] hover:underline font-medium"
              >
                {useCustomDepartment ? 'Choose existing' : '+ Custom department'}
              </button>
            </div>

            {useCustomDepartment ? (
              <input
                type="text"
                value={formData.customDepartment}
                onChange={(e) => setFormData({ ...formData, customDepartment: e.target.value })}
                placeholder="e.g. Fraud & Compliance"
                className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                  errors.department ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                } rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
              />
            ) : (
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                    {dept}
                  </option>
                ))}
              </select>
            )}
            {errors.department && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.department}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Maximum Agent Capacity <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.maxAgents}
              onChange={(e) => setFormData({ ...formData, maxAgents: parseInt(e.target.value, 10) || 0 })}
              className={`w-full px-3 py-2 bg-[var(--bg-glass-input)] border ${
                errors.maxAgents ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              } rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors`}
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Upper limit of agents this manager is authorized to supervise.
            </p>
            {errors.maxAgents && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.maxAgents}</p>}
          </div>
        </div>

        {/* Status & Hierarchy Role Confirmation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Platform Hierarchy Role
            </label>
            <div className="px-3 py-2 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-sm">
              <span className="text-[var(--text-primary)] font-medium">MANAGER</span>
              <Badge variant="success" size="sm">Fixed Hierarchy</Badge>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Managers sit beneath Super Admin and above Agents.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)] mt-6">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Manager
          </Button>
        </div>
      </form>
    </Modal>
  );
};
