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
    <Modal isOpen={isOpen} onClose={onClose} title="Add Number">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Target Range * */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Target Range *
          </label>
          <select
            value={rangeId}
            onChange={(e) => {
              setRangeId(e.target.value);
              const matched = ranges.find((r) => r.id === e.target.value);
              if (matched) {
                if (matched.countryId) setCountryId(matched.countryId);
                if (matched.providerId) setProviderId(matched.providerId);
              }
            }}
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">Type at least 1 character to search by range name...</option>
            {ranges.length > 0 ? (
              ranges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || `${r.startE164} - ${r.endE164}`}
                </option>
              ))
            ) : (
              <>
                <option value="range-1">test-for-test (Alaa0)</option>
                <option value="range-2">Alaa Test (UK)</option>
              </>
            )}
          </select>
        </div>

        {/* Full International Number * */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Full International Number *
          </label>
          <input
            type="text"
            required
            value={e164}
            onChange={(e) => {
              setE164(e.target.value);
              setError(null);
            }}
            placeholder="445555599999"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as NumberStatus)}
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Allocated</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--glass-border)]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            className="bg-teal-600 hover:bg-teal-500 text-white"
          >
            Create Number
          </Button>
        </div>
      </form>
    </Modal>
  );
};
