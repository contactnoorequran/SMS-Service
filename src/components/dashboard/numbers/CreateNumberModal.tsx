/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  CountrySummary,
  OperatorSummary,
  ProviderSummary,
  RangeSummary,
  CreateNumberPayload,
  NumberStatus,
} from '../../../types/numbers';
import { Hash, Globe, Radio, Server, DollarSign, AlertCircle, Plus } from 'lucide-react';

interface CreateNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  countries: CountrySummary[];
  operators: OperatorSummary[];
  providers: ProviderSummary[];
  ranges: RangeSummary[];
  onSubmit: (payload: CreateNumberPayload) => Promise<void>;
}

export const CreateNumberModal: React.FC<CreateNumberModalProps> = ({
  isOpen,
  onClose,
  countries,
  operators,
  providers,
  ranges,
  onSubmit,
}) => {
  const [e164, setE164] = useState('');
  const [countryId, setCountryId] = useState(countries[0]?.id || 'cnt-us');
  const [providerId, setProviderId] = useState(providers[0]?.id || 'prov-001');
  const [operatorId, setOperatorId] = useState('');
  const [rangeId, setRangeId] = useState('');
  const [status, setStatus] = useState<NumberStatus>('AVAILABLE');
  const [monthlyCost, setMonthlyCost] = useState('1.50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableOperators = operators.filter((op) => op.countryId === countryId);
  const availableRanges = ranges.filter((r) => r.countryId === countryId && r.providerId === providerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!e164.trim().startsWith('+')) {
      setError('Phone number must start with a valid E.164 country dial code prefix (e.g. +12025550199)');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        e164: e164.trim(),
        countryId,
        providerId,
        operatorId: operatorId || undefined,
        rangeId: rangeId || undefined,
        status,
        monthlyCost: parseFloat(monthlyCost) || 1.50,
      });
      onClose();
      // Reset
      setE164('');
      setOperatorId('');
      setRangeId('');
      setMonthlyCost('1.50');
    } catch (err: any) {
      setError(err?.message || 'Failed to register number in inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Phone Line to Inventory">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* E.164 Number Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            E.164 Phone Number *
          </label>
          <input
            type="text"
            required
            value={e164}
            onChange={(e) => {
              setE164(e.target.value);
              setError(null);
            }}
            placeholder="+12025550199"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        {/* Country & Provider Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
              Country *
            </label>
            <select
              value={countryId}
              onChange={(e) => {
                setCountryId(e.target.value);
                setOperatorId('');
                setRangeId('');
              }}
              required
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag} {c.name} ({c.dialCode})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
              Upstream Carrier Provider *
            </label>
            <select
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setRangeId('');
              }}
              required
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Operator & Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Network Operator (Optional)
            </label>
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="">Standard Telco / Direct Allocation</option>
              {availableOperators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Inventory Range (Optional)
            </label>
            <select
              value={rangeId}
              onChange={(e) => setRangeId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="">Stand-alone Single Number</option>
              {availableRanges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.startE164} - {r.endE164}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Initial Status & Monthly Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as NumberStatus)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="AVAILABLE">AVAILABLE (Ready for assignment)</option>
              <option value="RESERVED">RESERVED (Hold from assignment)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
              Monthly Base Cost ($)
            </label>
            <input
              type="number"
              step="0.10"
              min="0"
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Provision Number
          </Button>
        </div>
      </form>
    </Modal>
  );
};
