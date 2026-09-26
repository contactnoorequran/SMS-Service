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
      errs.countriesCovered = 'Specify at least one ISO-2 code (e.g. GB, US).';
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
      title="Register Carrier Gateway"
      subtitle="Connect a new SMPP trunk or HTTP provider gateway"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Name & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              Carrier Name <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sinch Tier-1 Global"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-all ${
                errors.name ? 'border-[var(--accent-rose)]' : 'border-[var(--glass-border)]'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              Gateway Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ProviderType })}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
            >
              <option value="TIER_1_CARRIER">Tier-1 Direct Carrier (MNO)</option>
              <option value="DIRECT_SMPP">Direct SMPP v3.4 Trunk</option>
              <option value="CLOUD_GATEWAY">Cloud API Gateway</option>
              <option value="AGGREGATOR">Wholesale Aggregator</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-[var(--text-secondary)] mb-1">
            Trunk Description
          </label>
          <input
            type="text"
            placeholder="e.g. Primary direct SS7 routing trunk for UK/EU destinations"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </div>

        {/* Coverage & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              Covered ISO Codes <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. GB, US, DE, FR"
              value={formData.countriesCovered}
              onChange={(e) => setFormData({ ...formData, countriesCovered: e.target.value })}
              className={`w-full px-3 py-2 font-mono bg-[rgba(0,0,0,0.2)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] ${
                errors.countriesCovered ? 'border-[var(--accent-rose)]' : 'border-[var(--glass-border)]'
              }`}
            />
            {errors.countriesCovered && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.countriesCovered}
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProviderStatus })}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
            >
              <option value="ACTIVE">ACTIVE (Route immediately)</option>
              <option value="INACTIVE">INACTIVE (Staging / Offline)</option>
            </select>
          </div>
        </div>

        {/* NOC Contacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              NOC Team Contact
            </label>
            <input
              type="text"
              placeholder="e.g. Frankfurt NOC"
              value={formData.technicalContact}
              onChange={(e) => setFormData({ ...formData, technicalContact: e.target.value })}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[var(--text-secondary)] mb-1">
              NOC Operations Email
            </label>
            <input
              type="email"
              placeholder="noc@carrier.com"
              value={formData.nocEmail}
              onChange={(e) => setFormData({ ...formData, nocEmail: e.target.value })}
              className="w-full px-3 py-2 bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--glass-border)]">
          <Button variant="outline" size="sm" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Save Carrier Gateway
          </Button>
        </div>
      </form>
    </Modal>
  );
};
