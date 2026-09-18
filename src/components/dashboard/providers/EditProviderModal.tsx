/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  ProviderItem,
  ProviderDetail,
  UpdateProviderPayload,
  ProviderType,
  ProviderStatus,
} from '../../../types/providers';
import {
  Radio,
  Globe,
  Mail,
  User,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';

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
  const [formData, setFormData] = useState<{
    name: string;
    type: ProviderType;
    description: string;
    status: ProviderStatus;
    countriesCovered: string;
    technicalContact: string;
    nocEmail: string;
  }>({
    name: '',
    type: 'TIER_1_CARRIER',
    description: '',
    status: 'ACTIVE',
    countriesCovered: '',
    technicalContact: '',
    nocEmail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (provider) {
      const detail = provider as ProviderDetail;
      setFormData({
        name: provider.name || '',
        type: provider.type || 'TIER_1_CARRIER',
        description: provider.description || '',
        status: provider.status || 'ACTIVE',
        countriesCovered: provider.countriesCovered?.join(', ') || 'GLOBAL',
        technicalContact: detail.technicalContact || '',
        nocEmail: detail.nocEmail || '',
      });
      setErrors({});
    }
  }, [provider]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Provider carrier name is required.';
    }

    if (!formData.countriesCovered.trim()) {
      errs.countriesCovered = 'Specify at least one ISO-2 country code.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const countriesList = formData.countriesCovered
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      await onSubmit(provider.id, {
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        status: formData.status,
        countriesCovered: countriesList.length > 0 ? countriesList : ['GLOBAL'],
        technicalContact: formData.technicalContact.trim() || undefined,
        nocEmail: formData.nocEmail.trim() || undefined,
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!provider) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Provider Gateway: ${provider.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Read-Only Identifier Callout */}
        <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <span className="text-[var(--text-secondary)]">Provider Trunk ID: </span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">{provider.id}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono ml-2">({provider.slug})</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[var(--accent-blue)] bg-[var(--accent-blue-dim)] px-2 py-0.5 rounded border border-[var(--accent-blue)]/20">
            {provider.type}
          </span>
        </div>

        {/* Name & Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Provider Carrier Name <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Radio className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] transition-all ${
                  errors.name ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Carrier Architecture Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ProviderType })}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="TIER_1_CARRIER">TIER_1_CARRIER (Direct MNO / CLEC)</option>
              <option value="DIRECT_SMPP">DIRECT_SMPP (Direct Socket Trunk)</option>
              <option value="AGGREGATOR">AGGREGATOR (Wholesale Aggregator)</option>
              <option value="CLOUD_GATEWAY">CLOUD_GATEWAY (Programmable API)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Operational Description
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            />
          </div>
        </div>

        {/* Country Coverage & Operational Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Countries Covered (ISO-2 Codes) <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={formData.countriesCovered}
                onChange={(e) => setFormData({ ...formData, countriesCovered: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] ${
                  errors.countriesCovered ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                }`}
              />
            </div>
            {errors.countriesCovered && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.countriesCovered}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Operational Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProviderStatus })}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="ACTIVE">ACTIVE (Operational)</option>
              <option value="INACTIVE">INACTIVE (Dormant)</option>
              <option value="SUSPENDED">SUSPENDED (Maintenance / Hold)</option>
            </select>
          </div>
        </div>

        {/* Technical Support Grid */}
        <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                Technical Contact / NOC Team
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={formData.technicalContact}
                  onChange={(e) => setFormData({ ...formData, technicalContact: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                NOC Operations Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={formData.nocEmail}
                  onChange={(e) => setFormData({ ...formData, nocEmail: e.target.value })}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
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
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
