/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ProviderItem,
  ProviderDetail,
  UpdateProviderPayload,
  ProviderStatus,
} from '../../../types/providers';
import {
  Server,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Button } from '../../ui/Button';

interface EditProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderItem | ProviderDetail | null;
  onSubmit: (id: string, payload: UpdateProviderPayload) => Promise<void>;
}

export const EditProviderModal: React.FC<EditProviderModalProps> = ({
  isOpen,
  onClose,
  provider,
  onSubmit,
}) => {
  const [providerName, setProviderName] = useState('');
  const [protocol, setProtocol] = useState<'SMPP' | 'HTTP API'>('SMPP');
  const [isActive, setIsActive] = useState(true);

  // SMPP Fields
  const [smppRole, setSmppRole] = useState<'Server' | 'Client'>('Server');
  const [listenPort, setListenPort] = useState('2775');
  const [sendOutboundMoDlr, setSendOutboundMoDlr] = useState(true);
  const [systemId, setSystemId] = useState('s30030');
  const [smppPassword, setSmppPassword] = useState('Wss2026!');
  const [showPassword, setShowPassword] = useState(false);

  // Client mode fields
  const [smppHost, setSmppHost] = useState('76.13.217.198');
  const [clientPort, setClientPort] = useState('2227');
  const [systemType, setSystemType] = useState('');
  const [bindMode, setBindMode] = useState('TRX — Transceiver (recommended)');

  // HTTP API Fields
  const [outboundUrl, setOutboundUrl] = useState('');
  const [outboundApiKey, setOutboundApiKey] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (provider) {
      setProviderName(provider.name || '');
      setProtocol(provider.type === 'CLOUD_GATEWAY' ? 'HTTP API' : 'SMPP');
      setIsActive(provider.status === 'ACTIVE');
      setSystemId(provider.slug || 's30030');
      setErrors({});
    }
  }, [provider]);

  if (!isOpen || !provider) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim()) {
      setErrors({ name: 'Provider Name is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(provider.id, {
        name: providerName.trim(),
        type: protocol === 'HTTP API' ? 'CLOUD_GATEWAY' : 'DIRECT_SMPP',
        status: (isActive ? 'ACTIVE' : 'INACTIVE') as ProviderStatus,
        description: protocol === 'SMPP'
          ? `SMPP ${smppRole}: Port ${smppRole === 'Server' ? listenPort : clientPort}, ID: ${systemId}`
          : `HTTP API: ${outboundUrl}`,
      });
      onClose();
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--glass-border)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Header matching Screenshot 3 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Edit Provider
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Top row: Provider Name, Protocol, Active Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Provider Name <span className="text-[var(--accent-rose)]">*</span>
              </label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className={`w-full px-3 py-2 bg-[var(--input-bg)] border rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition-all ${
                  errors.name ? 'border-[var(--accent-rose)]' : 'border-[var(--input-border)]'
                }`}
              />
              {errors.name && (
                <p className="text-[10px] text-[var(--accent-rose)] mt-1">{errors.name}</p>
              )}
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as 'SMPP' | 'HTTP API')}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
              >
                <option value="SMPP">SMPP</option>
                <option value="HTTP API">HTTP API</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pb-2">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Active
              </span>
            </div>
          </div>

          {protocol === 'SMPP' ? (
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                SMPP Settings
              </h3>

              {/* SMPP Role Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  SMPP Role
                </label>
                <select
                  value={smppRole === 'Server' ? 'Server — provider connects to our SMSC' : 'Client — we connect to provider SMSC'}
                  onChange={(e) => {
                    if (e.target.value.includes('Server')) {
                      setSmppRole('Server');
                    } else {
                      setSmppRole('Client');
                    }
                  }}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                >
                  <option value="Server — provider connects to our SMSC">
                    Server — provider connects to our SMSC
                  </option>
                  <option value="Client — we connect to provider SMSC">
                    Client — we connect to provider SMSC
                  </option>
                </select>
              </div>

              {smppRole === 'Server' ? (
                <>
                  {/* Server Mode (Screenshot 3) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        Your listen port
                      </label>
                      <input
                        type="text"
                        value={listenPort}
                        onChange={(e) => setListenPort(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                      />
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                        Open this TCP port in the firewall. Default: 2775
                      </p>
                    </div>

                    <div className="sm:col-span-6 flex items-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setSendOutboundMoDlr(!sendOutboundMoDlr)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          sendOutboundMoDlr ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            sendOutboundMoDlr ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        Send outbound MO DLR
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        System ID
                      </label>
                      <input
                        type="text"
                        value={systemId}
                        onChange={(e) => setSystemId(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                      />
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                        Provider uses this ID when binding to your server.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        SMPP Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={smppPassword}
                          onChange={(e) => setSmppPassword(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Client Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-9">
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        Provider SMPP Host / IP
                      </label>
                      <input
                        type="text"
                        value={smppHost}
                        onChange={(e) => setSmppHost(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        Port
                      </label>
                      <input
                        type="text"
                        value={clientPort}
                        onChange={(e) => setClientPort(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        System ID
                      </label>
                      <input
                        type="text"
                        value={systemId}
                        onChange={(e) => setSystemId(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        SMPP Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={smppPassword}
                          onChange={(e) => setSmppPassword(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        System Type
                      </label>
                      <input
                        type="text"
                        value={systemType}
                        onChange={(e) => setSystemType(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                        Bind Mode
                      </label>
                      <select
                        value={bindMode}
                        onChange={(e) => setBindMode(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                      >
                        <option value="TRX — Transceiver (recommended)">TRX — Transceiver (recommended)</option>
                        <option value="TX — Transmitter only">TX — Transmitter only</option>
                        <option value="RX — Receiver only">RX — Receiver only</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Provider Outbound API URL
                </label>
                <input
                  type="text"
                  value={outboundUrl}
                  onChange={(e) => setOutboundUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--glass-border)]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
