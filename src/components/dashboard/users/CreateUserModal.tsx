import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { CreateUserPayload } from '../../../types/users';
import { UserRole, UserStatus } from '../../../types/auth';
import { UserPlus, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Full name is required';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', score: 0, color: 'bg-[var(--glass-bg-active)]' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', score: 1, color: 'bg-[var(--accent-rose)]' };
    if (score <= 3) return { label: 'Medium', score: 2, color: 'bg-[var(--accent-amber)]' };
    return { label: 'Strong', score: 3, color: 'bg-[var(--accent-emerald)]' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        status,
        department: department.trim() || undefined,
      });
      // Clear sensitive fields
      setPassword('');
      setConfirmPassword('');
      setName('');
      setEmail('');
      setDepartment('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user account';
      setErrors((prev) => ({ ...prev, form: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User Account"
      subtitle="Provision enterprise identity credentials with assigned RBAC permissions"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-lg bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.3)] text-xs text-[var(--accent-rose)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="create-user-name" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Full Name <span className="text-[var(--accent-rose)]">*</span>
          </label>
          <input
            id="create-user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Khan"
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
          {errors.name && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.name}</p>}
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="create-user-email" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Email Address <span className="text-[var(--accent-rose)]">*</span>
          </label>
          <input
            id="create-user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. sarah.khan@sms-telecom.io"
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
          {errors.email && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.email}</p>}
        </div>

        {/* Role and Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="create-user-role" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Role Profile <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <select
              id="create-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors cursor-pointer"
            >
              <option value="CLIENT">Client (End Tenant)</option>
              <option value="AGENT">Agent (Portfolio Partner)</option>
              <option value="MANAGER">Manager (Operations)</option>
              <option value="SUPER_ADMIN">Super Administrator (Root)</option>
            </select>
          </div>

          <div>
            <label htmlFor="create-user-status" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Account Status
            </label>
            <select
              id="create-user-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors cursor-pointer"
            >
              <option value="ACTIVE">Active (Immediate Access)</option>
              <option value="PENDING">Pending (Requires Activation)</option>
            </select>
          </div>
        </div>

        {/* Department / Org */}
        <div>
          <label htmlFor="create-user-department" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Department / Tenant Name
          </label>
          <input
            id="create-user-department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Carrier Operations or Apex Media"
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="create-user-password" className="text-xs font-medium text-[var(--text-secondary)]">
                Password <span className="text-[var(--accent-rose)]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[var(--accent-blue)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              id="create-user-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors font-mono"
            />
            {errors.password && <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="create-user-confirm-password" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Confirm Password <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              id="create-user-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors font-mono"
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-[var(--text-tertiary)]">Password Strength:</span>
              <span className="font-semibold text-[var(--text-primary)]">{strength.label}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--glass-bg-active)] overflow-hidden flex gap-1">
              <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'opacity-20'}`} />
              <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'opacity-20'}`} />
              <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'opacity-20'}`} />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
};
