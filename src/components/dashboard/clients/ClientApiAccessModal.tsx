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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-surface)]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 bg-indigo-500/20 text-indigo-600 text-[var(--accent-violet)] rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] text-white">API Access & Integration</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Configure programmatic REST API keys and rate limits for {client.companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[var(--accent-rose-dim)] border border-rose-200 border-rose-800/60 rounded-xl text-xs text-rose-700 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Secret Notice */}
          {generatedSecret && (
            <div className="p-4 bg-[var(--accent-emerald-dim)] border border-emerald-200 border-emerald-800/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-emerald)]" />
                <span>New API Secret Generated</span>
              </div>
              <p className="text-xs text-[var(--accent-emerald)]">
                Copy this secret key immediately. It will not be visible again.
              </p>
              <div className="flex items-center justify-between font-mono text-xs bg-[var(--glass-bg)] backdrop-blur-md p-2.5 rounded-lg border border-emerald-300 border-emerald-800 text-emerald-800 text-emerald-300 select-all break-all">
                <span>{generatedSecret}</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="ml-2 text-xs text-indigo-600 text-[var(--accent-violet)] font-medium flex items-center gap-1"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Toggle Enable/Disable */}
            <div className="flex items-center justify-between p-3.5 bg-[var(--glass-bg)]/40 rounded-xl border border-[var(--glass-border)]">
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] text-white block">
                  Enable REST API Ingestion
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
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
                <div className="w-11 h-6 bg-[var(--glass-bg)] peer-focus:outline-hidden rounded-full peer bg-[var(--glass-bg-active)] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--glass-bg)] after:border-[var(--glass-border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-[var(--glass-border)] peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Current API Key ID */}
            {client.apiAccess?.apiKey && (
              <div className="p-3 bg-[var(--glass-bg)]/40 rounded-xl border border-[var(--glass-border)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    Active API Key Identifier
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="flex items-center gap-1 text-xs text-indigo-600 text-[var(--accent-violet)] font-medium"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-[var(--text-secondary)] select-all">
                  {client.apiAccess.apiKey}
                </div>
                {client.apiAccess.lastUsedAt && (
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Last utilized: {new Date(client.apiAccess.lastUsedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Rate Limiting */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Rate Limit Threshold (Requests / Second)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={rateLimit}
                onChange={(e) => setRateLimit(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 text-xs bg-[var(--glass-bg)]/60 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                Protects platform downstream carrier gateways from bursts exceeding contract tiers.
              </p>
            </div>

            {/* Rotate Secret Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-[var(--accent-amber-dim)] rounded-xl border border-amber-200 border-amber-800/40">
              <input
                type="checkbox"
                id="rotateSecret"
                checked={rotateSecret}
                onChange={(e) => setRotateSecret(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="rotateSecret" className="text-xs text-amber-900 text-amber-200 cursor-pointer">
                <span className="font-semibold">Rotate API Key & Secret:</span> Invalidate existing tokens and generate a fresh production credential pair.
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] rounded-xl transition-colors"
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
