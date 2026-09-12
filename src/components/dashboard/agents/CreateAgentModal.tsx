import React, { useState } from 'react';
import { CreateAgentDTO } from '../../../types/agent';
import { Modal } from '../../ui/Modal';
import { UserCheck, Shield, AlertCircle, KeyRound, Copy, Check } from 'lucide-react';
import { ManagerListItem } from '../../../types/manager';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAgentDTO) => Promise<{ agent: any; generatedPassword?: string }>;
  managers: ManagerListItem[];
  currentRole: string;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  managers,
  currentRole,
}) => {
  const [formData, setFormData] = useState<CreateAgentDTO>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    managerId: managers.length > 0 ? managers[0].id : '',
    commissionRate: 0.05,
    status: 'ACTIVE',
    password: '',
  });

  const [autoGeneratePassword, setAutoGeneratePassword] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    agent: any;
    generatedPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const resetForm = () => {
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      contact: '',
      managerId: managers.length > 0 ? managers[0].id : '',
      commissionRate: 0.05,
      status: 'ACTIVE',
      password: '',
    });
    setAutoGeneratePassword(true);
    setError(null);
    setSuccessData(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: CreateAgentDTO = {
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        contact: formData.contact.trim(),
        commissionRate: Number(formData.commissionRate),
        status: formData.status,
      };

      if (currentRole === 'SUPER_ADMIN') {
        payload.managerId = formData.managerId || null;
      }

      if (!autoGeneratePassword && formData.password?.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await onSubmit(payload);
      setSuccessData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to create agent profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Agent Profile"
      subtitle="Register an operational agent, configure commission rate, and allocate managerial hierarchy"
      maxWidth="lg"
    >
      {successData ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-600" />
              Agent Successfully Created
            </div>
            <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-400">
              The agent account has been provisioned and is ready for login and client onboarding.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Agent Details</span>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {successData.agent.name} ({successData.agent.username})
              </div>
              <div className="text-xs text-slate-500">{successData.agent.email}</div>
            </div>

            {successData.generatedPassword && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    Temporary Password (One-Time Display)
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(successData.generatedPassword!)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 rounded border border-amber-300 hover:bg-amber-50"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-all">
                  {successData.generatedPassword}
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
                  Securely provide this temporary password to the agent. It is never stored in plaintext.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. marcus.brody"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. agent@smshub.local"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Marcus"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Brody"
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
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="e.g. +1 (202) 555-0188"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Commission Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.005"
                  min="0"
                  max="1"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">
                  {(formData.commissionRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {currentRole === 'SUPER_ADMIN' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign To Manager
                </label>
                <select
                  value={formData.managerId || ''}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value || null })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned (Direct Super Admin)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department || 'Operations'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to operate)</option>
                  <option value="INACTIVE">INACTIVE (Dormant)</option>
                  <option value="SUSPENDED">SUSPENDED (Access blocked)</option>
                </select>
              </div>
            </div>
          )}

          {/* Password Provisioning */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                Initial Credential Setup
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={autoGeneratePassword}
                  onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-generate secure password
              </label>
            </div>

            {!autoGeneratePassword && (
              <div>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Set custom initial password (min 8 characters)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
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
              {isLoading ? 'Creating Agent...' : 'Create Agent'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
