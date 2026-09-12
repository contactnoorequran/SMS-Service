import React, { useState, useEffect } from 'react';
import { CreateClientDTO } from '../../../types/client';
import { AgentListItem } from '../../../types/agent';
import { apiClient } from '../../../services/api';
import { X, Building2, User, Mail, Phone, DollarSign, Shield, Key, AlertCircle } from 'lucide-react';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
  currentAgentId?: string | null;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
  currentAgentId,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [billingType, setBillingType] = useState<'PREPAID' | 'POSTPAID'>('PREPAID');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [agentId, setAgentId] = useState<string>(currentAgentId || '');
  const [initialBalance, setInitialBalance] = useState<number>(100);
  const [generateApiKey, setGenerateApiKey] = useState(true);
  const [password, setPassword] = useState('');
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);

  const [availableAgents, setAvailableAgents] = useState<AgentListItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createdResult, setCreatedResult] = useState<{
    clientName: string;
    email: string;
    generatedPassword?: string;
    apiKey?: { key: string; secretPlain?: string };
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient.getAgents({ limit: 100, status: 'ACTIVE' })
        .then((res) => {
          setAvailableAgents(res.items || []);
          if (!agentId && res.items && res.items.length > 0) {
            setAgentId(res.items[0].id);
          }
        })
        .catch(() => {
          setAvailableAgents([]);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const parts = contactName.trim().split(' ');
      const firstName = parts[0] || 'Client';
      const lastName = parts.slice(1).join(' ') || 'User';
      const username = email.trim().split('@')[0] || `client_${Date.now()}`;

      const payload: CreateClientDTO = {
        username,
        firstName,
        lastName,
        email: email.trim(),
        companyName: companyName.trim(),
        contact: contact.trim(),
        billingType,
        agentId: agentId || undefined,
        initialBalance: billingType === 'PREPAID' ? initialBalance : 0,
        enableApiAccess: generateApiKey,
        password: autoGeneratePassword ? undefined : password,
      };

      const res = await apiClient.createClient(payload);

      setCreatedResult({
        clientName: res.client.companyName,
        email: res.client.email,
        generatedPassword: res.generatedPassword,
        apiKey: res.generatedApiKey,
      });

      onClientCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedResult(null);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setContact('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Provision New Client</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enroll a customer account with assigned agent hierarchy, billing ledger, and API credentials
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen after creation */}
        {createdResult ? (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Client Successfully Provisioned!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Account created for <strong>{createdResult.clientName}</strong> ({createdResult.email}). Save the credentials below.
              </p>
            </div>

            {createdResult.generatedPassword && (
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>Temporary Access Password</span>
                </div>
                <div className="font-mono text-sm bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 select-all break-all">
                  {createdResult.generatedPassword}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  The client will be required to change this password on first login.
                </p>
              </div>
            )}

            {createdResult.apiKey && (
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span>Generated API Key & Secret</span>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400">API Key ID</label>
                  <div className="font-mono text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 select-all">
                    {createdResult.apiKey.key}
                  </div>
                </div>
                {createdResult.apiKey.secretPlain && (
                  <div className="space-y-1 mt-2">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400">API Secret (Shown once)</label>
                    <div className="font-mono text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 select-all break-all">
                      {createdResult.apiKey.secretPlain}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
              >
                Done & Return to Clients
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme FinTech Corp"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Primary Contact Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@acmefintech.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Phone Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Contact <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Assigned Agent */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Agent Portfolio
                </label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned (Direct Platform Client)</option>
                  {availableAgents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.companyName || ag.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Model <span className="text-rose-500">*</span>
                </label>
                <select
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value as 'PREPAID' | 'POSTPAID')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PREPAID">PREPAID (Top-up Balance Required)</option>
                  <option value="POSTPAID">POSTPAID (Invoiced with Credit Limit)</option>
                </select>
              </div>

              {/* Balance / Credit Limit */}
              {billingType === 'PREPAID' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Deposit Balance ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Limit ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Password configuration */}
              <div className="md:col-span-2 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Authentication Credentials
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGeneratePassword}
                      onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Auto-generate secure temporary password</span>
                  </label>
                </div>
                {!autoGeneratePassword && (
                  <input
                    type="password"
                    placeholder="Enter manual initial password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              {/* API Access Option */}
              <div className="md:col-span-2 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="genApi"
                  checked={generateApiKey}
                  onChange={(e) => setGenerateApiKey(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="genApi" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="font-semibold">Provision REST API Access Key:</span> Automatically issue a production API key with 100 req/sec limit.
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <span>Create Client Account</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
