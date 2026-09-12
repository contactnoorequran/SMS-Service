import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { CreateManagerDTO } from '../../../types/manager';
import { UserCheck, Key, Copy, Check, AlertCircle, Shield } from 'lucide-react';

interface CreateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateManagerDTO) => Promise<{ generatedPassword?: string } | void>;
  departments: string[];
}

export const CreateManagerModal: React.FC<CreateManagerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments,
}) => {
  const [formData, setFormData] = useState<CreateManagerDTO>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    department: departments[0] || 'Carrier Operations',
    maxAgents: 50,
    status: 'ACTIVE',
    password: '',
  });

  const [autoGeneratePassword, setAutoGeneratePassword] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCreds, setGeneratedCreds] = useState<{ username: string; email: string; password?: string } | null>(
    null
  );
  const [copied, setCopied] = useState<boolean>(false);

  const resetForm = () => {
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      contact: '',
      department: departments[0] || 'Carrier Operations',
      maxAgents: 50,
      status: 'ACTIVE',
      password: '',
    });
    setAutoGeneratePassword(true);
    setError(null);
    setGeneratedCreds(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!formData.firstName || !formData.lastName) {
      setError('First and Last names are required.');
      return;
    }
    if (!formData.email || !formData.email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }
    if (!formData.contact || formData.contact.length < 5) {
      setError('Valid contact phone number is required.');
      return;
    }
    if (!autoGeneratePassword && (!formData.password || formData.password.length < 8)) {
      setError('Custom password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateManagerDTO = {
        ...formData,
        password: autoGeneratePassword ? undefined : formData.password,
      };

      const result = await onSubmit(payload);
      const pass = result?.generatedPassword || formData.password;

      setGeneratedCreds({
        username: formData.username,
        email: formData.email,
        password: pass,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCreds?.password) return;
    navigator.clipboard.writeText(
      `SMS Platform Manager Credentials:\nEmail: ${generatedCreds.email}\nUsername: ${generatedCreds.username}\nTemporary Password: ${generatedCreds.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={generatedCreds ? 'Manager Account Created' : 'Create Manager Profile'}
      subtitle={
        generatedCreds
          ? 'Secure temporary credentials generated for initial onboarding'
          : 'Provision an operational manager with agent oversight rights'
      }
      maxWidth="lg"
    >
      {generatedCreds ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Manager Successfully Provisioned
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  The account has been created and an immutable audit record was generated.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-sans font-medium text-slate-300">Access Credentials</span>
              <span className="text-[10px] uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                Display Once
              </span>
            </div>
            <div>
              <span className="text-slate-400">Username: </span>
              <span className="text-white font-semibold">{generatedCreds.username}</span>
            </div>
            <div>
              <span className="text-slate-400">Email: </span>
              <span className="text-white font-semibold">{generatedCreds.email}</span>
            </div>
            <div>
              <span className="text-slate-400">Temporary Password: </span>
              <span className="text-emerald-400 font-semibold bg-slate-950 px-2 py-1 rounded select-all">
                {generatedCreds.password}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Passwords are cryptographically hashed and never stored in plaintext. Copy or share these credentials
              now.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Marcus"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Vance"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                placeholder="e.g. marcus.vance"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. m.vance@sms-platform.internal"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+1 (555) 019-4820"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Routing Operations"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Max Agents Limit
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.maxAgents}
                onChange={(e) => setFormData({ ...formData, maxAgents: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Initial Account Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE (Ready for immediate access)</option>
                <option value="PENDING">PENDING (Requires onboarding)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                Password Provisioning
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGeneratePassword}
                  onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Auto-generate strong password
              </label>
            </div>

            {!autoGeneratePassword && (
              <div>
                <input
                  type="password"
                  placeholder="Enter initial password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Manager...' : 'Create Manager Account'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
