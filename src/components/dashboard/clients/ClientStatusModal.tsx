import React, { useState } from 'react';
import { ClientDetail } from '../../../types/client';
import { apiClient } from '../../../services/api';
import { X, Power, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ClientStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetail | null;
  onStatusUpdated: () => void;
}

export const ClientStatusModal: React.FC<ClientStatusModalProps> = ({
  isOpen,
  onClose,
  client,
  onStatusUpdated,
}) => {
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('SUSPENDED');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (client) {
      // Default to opposite of current status
      setStatus(client.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
      setReason('');
      setError(null);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A justification reason is required for security and audit compliance.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.updateClientStatus(client.id, status, reason.trim());
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update client status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuspending = status === 'SUSPENDED' || status === 'INACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isSuspending
                ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Modify Client Lifecycle</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {client.companyName} ({client.email})
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
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Status State
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('ACTIVE')}
                  className={`p-3 text-xs font-medium rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    status === 'ACTIVE'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ACTIVE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('SUSPENDED')}
                  className={`p-3 text-xs font-medium rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    status === 'SUSPENDED'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>SUSPENDED</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('INACTIVE')}
                  className={`p-3 text-xs font-medium rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    status === 'INACTIVE'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>INACTIVE</span>
                </button>
              </div>
            </div>

            {isSuspending && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                Suspending this client will immediately block API message dispatch, inbound webhooks, and portal access.
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audit Reason / Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Compliance verification required for KYB documentation or customer requested reactivation"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                This explanation is permanently logged to the system immutable audit record.
              </p>
            </div>
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
              className={`px-5 py-2.5 text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 text-white ${
                isSuspending
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm Status Update</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
