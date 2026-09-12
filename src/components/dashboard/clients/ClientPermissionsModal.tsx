import React, { useState, useEffect } from 'react';
import { ClientDetail } from '../../../types/client';
import { apiClient } from '../../../services/api';
import { X, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface ClientPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetail | null;
  onPermissionsUpdated: () => void;
}

const AVAILABLE_CLIENT_PERMISSIONS = [
  { id: 'numbers.view', label: 'View Assigned Phone Numbers', category: 'Numbers', desc: 'Can view inventory of numbers allocated to this client account' },
  { id: 'sms.send', label: 'Dispatch Outbound SMS', category: 'SMS', desc: 'Can submit SMS transmission requests via portal and API' },
  { id: 'sms.view', label: 'View SMS Logs & CDRs', category: 'SMS', desc: 'Can read inbound/outbound SMS history and message statuses' },
  { id: 'reports.view', label: 'Access Analytics & Reports', category: 'Analytics', desc: 'Can view delivery rates, throughput charts, and error rates' },
  { id: 'billing.view', label: 'View Invoices & Balance Ledger', category: 'Billing', desc: 'Can view credit balance, payment receipts, and billing statements' },
  { id: 'api.access', label: 'REST API Programmatic Access', category: 'API', desc: 'Can generate API keys and invoke customer API endpoints' },
  { id: 'webhooks.manage', label: 'Configure Inbound Webhooks', category: 'API', desc: 'Can set custom webhook endpoints for incoming message webhooks' },
];

export const ClientPermissionsModal: React.FC<ClientPermissionsModalProps> = ({
  isOpen,
  onClose,
  client,
  onPermissionsUpdated,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setSelectedPermissions(client.permissions || []);
      setError(null);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleToggle = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(AVAILABLE_CLIENT_PERMISSIONS.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.updateClientPermissions(client.id, selectedPermissions);
      onPermissionsUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update client permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Configure Client Permissions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant or restrict capability scopes for {client.companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Active Capabilities ({selectedPermissions.length} selected)
            </span>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {AVAILABLE_CLIENT_PERMISSIONS.map((perm) => {
              const isChecked = selectedPermissions.includes(perm.id);
              return (
                <div
                  key={perm.id}
                  onClick={() => handleToggle(perm.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors ${
                    isChecked
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {perm.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {perm.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {perm.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Permissions Matrix</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
