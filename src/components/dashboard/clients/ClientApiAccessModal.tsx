import React, { useState, useEffect } from 'react';
import { ClientDetail } from '../../../types/client';
import { apiClient } from '../../../services/api';
import { X, Key, ShieldCheck, RefreshCw, Copy, Check, AlertCircle, ShieldAlert } from 'lucide-react';

interface ClientApiAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetail | null;
  onApiUpdated: () => void;
}

export const ClientApiAccessModal: React.FC<ClientApiAccessModalProps> = ({
  isOpen,
  onClose,
  client,
  onApiUpdated,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [rateLimit, setRateLimit] = useState(100);
  const [rotateSecret, setRotateSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (client) {
      setEnabled(client.apiAccess?.enabled || false);
      setRateLimit(client.apiAccess?.rateLimitPerSecond || 100);
      setRotateSecret(false);
      setGeneratedSecret(null);
      setError(null);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient.configureClientApiAccess(client.id, {
        enabled,
        rateLimitPerSecond: rateLimit,
        rotateSecret,
      });

      if (res.newSecretPlain) {
        setGeneratedSecret(res.newSecretPlain);
      }

      onApiUpdated();
      if (!res.newSecretPlain) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to configure API access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyKey = () => {
    if (client.apiAccess?.apiKey) {
      navigator.clipboard.writeText(client.apiAccess.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopySecret = () => {
    if (generatedSecret) {
      navigator.clipboard.writeText(generatedSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">API Access & Integration</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure programmatic REST API keys and rate limits for {client.companyName}
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

          {/* New Secret Notice */}
          {generatedSecret && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>New API Secret Generated</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Copy this secret key immediately. It will not be visible again.
              </p>
              <div className="flex items-center justify-between font-mono text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 select-all break-all">
                <span>{generatedSecret}</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Toggle Enable/Disable */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Enable REST API Ingestion
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Allow client systems to submit SMS and query delivery receipts via HTTP API
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Current API Key ID */}
            {client.apiAccess?.apiKey && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Active API Key Identifier
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400 select-all">
                  {client.apiAccess.apiKey}
                </div>
                {client.apiAccess.lastUsedAt && (
                  <p className="text-[10px] text-slate-400">
                    Last utilized: {new Date(client.apiAccess.lastUsedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Rate Limiting */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rate Limit Threshold (Requests / Second)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={rateLimit}
                onChange={(e) => setRateLimit(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Protects platform downstream carrier gateways from bursts exceeding contract tiers.
              </p>
            </div>

            {/* Rotate Secret Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
              <input
                type="checkbox"
                id="rotateSecret"
                checked={rotateSecret}
                onChange={(e) => setRotateSecret(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="rotateSecret" className="text-xs text-amber-900 dark:text-amber-200 cursor-pointer">
                <span className="font-semibold">Rotate API Key & Secret:</span> Invalidate existing tokens and generate a fresh production credential pair.
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {generatedSecret ? 'Done' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Configuring...</span>
                </>
              ) : (
                <span>Apply API Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
