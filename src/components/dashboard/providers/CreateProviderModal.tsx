/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CreateProviderPayload,
  ProviderType,
  ProviderStatus,
} from '../../../types/providers';
import {
  X,
  Eye,
  EyeOff,
  Info,
  CheckCircle2,
  Layers,
  Server,
  Radio,
} from 'lucide-react';

interface CreateProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProviderPayload) => Promise<void>;
}

export const CreateProviderModal: React.FC<CreateProviderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [providerName, setProviderName] = useState('');
  const [protocol, setProtocol] = useState<'HTTP API' | 'SMPP'>('HTTP API');
  const [isActive, setIsActive] = useState(true);

  // HTTP Settings
  const [httpDirection, setHttpDirection] = useState('Both directions');
  const [outboundUrl, setOutboundUrl] = useState('admin');
  const [outboundApiKey, setOutboundApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [bypassInboundToken, setBypassInboundToken] = useState(false);

  // SMPP Settings
  const [smppHost, setSmppHost] = useState('76.13.217.198');
  const [smppPort, setSmppPort] = useState('2775');
  const [smppSystemId, setSmppSystemId] = useState('worldsms');
  const [smppPassword, setSmppPassword] = useState('');
  const [showSmppPassword, setShowSmppPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setProviderName('');
    setProtocol('HTTP API');
    setIsActive(true);
    setHttpDirection('Both directions');
    setOutboundUrl('admin');
    setOutboundApiKey('');
    setShowApiKey(false);
    setBypassInboundToken(false);
    setSmppHost('76.13.217.198');
    setSmppPort('2775');
    setSmppSystemId('worldsms');
    setSmppPassword('');
    setShowSmppPassword(false);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!providerName.trim()) {
      errs.name = 'Provider name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const type: ProviderType = protocol === 'HTTP API' ? 'CLOUD_GATEWAY' : 'DIRECT_SMPP';
      const status: ProviderStatus = isActive ? 'ACTIVE' : 'INACTIVE';

      await onSubmit({
        name: providerName.trim(),
        type,
        status,
        description: protocol === 'HTTP API'
          ? `HTTP API Trunk (${httpDirection}) - Outbound: ${outboundUrl}`
          : `SMPP Trunk (${smppHost}:${smppPort} / ID: ${smppSystemId})`,
        countriesCovered: ['GLOBAL'],
      });
      handleClose();
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card-bg,#1e293b)] text-[var(--text-primary,#f8fafc)] border border-[var(--glass-border,#334155)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border,#334155)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary,#f8fafc)]">
              Add Provider
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--text-tertiary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)] p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Top row: Provider Name, Protocol, Active Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                Provider Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Provider Name *"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className={`w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border rounded-xl text-xs text-[var(--text-primary,#f8fafc)] placeholder:text-[var(--text-tertiary,#64748b)] focus:outline-none focus:border-teal-500 transition-all ${
                  errors.name ? 'border-rose-500' : 'border-[var(--glass-border,#334155)]'
                }`}
              />
              {errors.name && (
                <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as any)}
                className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="HTTP API">HTTP API</option>
                <option value="SMPP">SMPP</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-start sm:justify-end pb-1.5 gap-2">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-semibold text-[var(--text-secondary,#94a3b8)]">
                Active
              </span>
            </div>
          </div>

          {/* Section: HTTP Settings */}
          {protocol === 'HTTP API' ? (
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-bold text-[var(--text-primary,#f8fafc)] uppercase tracking-wider">
                HTTP Settings
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                  HTTP Direction
                </label>
                <select
                  value={httpDirection}
                  onChange={(e) => setHttpDirection(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="Both directions">Both directions</option>
                  <option value="Inbound only">Inbound only (receive to webhook)</option>
                  <option value="Outbound only">Outbound only (POST to provider API)</option>
                </select>
                <p className="text-[10px] text-[var(--text-tertiary,#64748b)] mt-1">
                  Receive = they POST to your webhook. Send = you POST to their API.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                  Provider Outbound API URL
                </label>
                <input
                  type="text"
                  placeholder="https://api.provider.com/v1/sms/send or admin"
                  value={outboundUrl}
                  onChange={(e) => setOutboundUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] placeholder:text-[var(--text-tertiary,#64748b)] focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                  Provider Outbound API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter API Key / Bearer Token"
                    value={outboundApiKey}
                    onChange={(e) => setOutboundApiKey(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] placeholder:text-[var(--text-tertiary,#64748b)] focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)]"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-teal-400" />}
                  </button>
                </div>
              </div>

              {/* Inbound Payload Format Notice */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-start gap-2.5 text-[11px]">
                <Info className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                <span className="font-mono text-[11px] leading-relaxed break-all">
                  Inbound payload format: POST JSON {'{"to":"925...","from":"123...","message":"text","msg_id":"optional"}'}
                </span>
              </div>

              {/* Bypass Inbound Token Toggle */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setBypassInboundToken(!bypassInboundToken)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    bypassInboundToken ? 'bg-teal-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      bypassInboundToken ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-[var(--text-primary,#f8fafc)]">
                  Bypass Inbound Token
                </span>
              </div>

              {/* Generated Notice */}
              <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-teal-300 flex items-center gap-2.5 text-[11px]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
                <span>An inbound token and webhook URL will be generated after you save.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-bold text-[var(--text-primary,#f8fafc)] uppercase tracking-wider">
                SMPP Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Host / IP
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 76.13.217.198"
                    value={smppHost}
                    onChange={(e) => setSmppHost(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    placeholder="2775"
                    value={smppPort}
                    onChange={(e) => setSmppPort(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    System ID
                  </label>
                  <input
                    type="text"
                    placeholder="worldsms"
                    value={smppSystemId}
                    onChange={(e) => setSmppSystemId(e.target.value)}
                    className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#94a3b8)] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSmppPassword ? 'text' : 'password'}
                      placeholder="SMPP Password"
                      value={smppPassword}
                      onChange={(e) => setSmppPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border,#334155)] rounded-xl text-xs text-[var(--text-primary,#f8fafc)] focus:outline-none focus:border-teal-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmppPassword(!showSmppPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)]"
                    >
                      {showSmppPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-teal-400" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2.5 text-[11px]">
                <Radio className="w-4 h-4 shrink-0 text-amber-400" />
                <span>SMPP transceiver socket will bind to standard port 2775 upon creation.</span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--glass-border,#334155)]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary,#94a3b8)] hover:text-[var(--text-primary,#f8fafc)] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
