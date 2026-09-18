/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  CreateProviderPayload,
  ProviderType,
  ProviderStatus,
} from '../../../types/providers';
import {
  Radio,
  Building2,
  Globe,
  Mail,
  User,
  Shield,
  AlertCircle,
  FileText,
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
    countriesCovered: 'GB, US, DE',
    technicalContact: '',
    nocEmail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'TIER_1_CARRIER',
      description: '',
      status: 'ACTIVE',
      countriesCovered: 'GB, US, DE',
      technicalContact: '',
      nocEmail: '',
    });
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Provider carrier name is required.';
    }

    if (!formData.countriesCovered.trim()) {
      errs.countriesCovered = 'Specify at least one ISO-2 country code (e.g. GB, US).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const countriesList = formData.countriesCovered
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      await onSubmit({
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        status: formData.status,
        countriesCovered: countriesList.length > 0 ? countriesList : ['GLOBAL'],
        technicalContact: formData.technicalContact.trim() || undefined,
        nocEmail: formData.nocEmail.trim() || undefined,
      });
      handleClose();
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Carrier Gateway Provider"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Security & KMS Architecture Callout */}
        <div className="p-3 bg-[var(--accent-blue-dim)] border border-[var(--accent-blue)]/20 rounded-xl flex items-center gap-2.5 text-xs text-[var(--accent-blue)]">
          <Shield className="w-4 h-4 shrink-0" />
          <span>
            Carrier credentials use envelope-encrypted KMS references. Plaintext secrets are never stored or exposed in the UI.
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
                placeholder="e.g. Sinch Tier-1 Global"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] transition-all ${
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
              <option value="TIER_1_CARRIER">TIER_1_CARRIER (Direct MNO / CLEC Interconnect)</option>
              <option value="DIRECT_SMPP">DIRECT_SMPP (Direct Socket Trunk)</option>
              <option value="AGGREGATOR">AGGREGATOR (Wholesale Carrier Aggregator)</option>
              <option value="CLOUD_GATEWAY">CLOUD_GATEWAY (Programmable API Gateway)</option>
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
              placeholder="e.g. Primary direct SS7 routing trunk for UK and European destination networks"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            />
          </div>
        </div>

        {/* Country Coverage & Initial Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Countries Covered (ISO-2 Codes) <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="e.g. GB, US, DE, FR, CA"
                value={formData.countriesCovered}
                onChange={(e) => setFormData({ ...formData, countriesCovered: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] ${
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
              Initial Operational Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProviderStatus })}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="ACTIVE">ACTIVE (Ready for connection binds)</option>
              <option value="INACTIVE">INACTIVE (Staging / Pre-deployment)</option>
            </select>
          </div>
        </div>

        {/* Technical Contacts Grid */}
        <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--accent-purple)]" />
            NOC & Technical Support Escort
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                NOC Team / Contact Person
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="e.g. Carrier NOC Frankfurt"
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
                  placeholder="e.g. noc@carrier.com"
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
            onClick={handleClose}
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
            Create Provider
          </Button>
        </div>
      </form>
    </Modal>
  );
};
