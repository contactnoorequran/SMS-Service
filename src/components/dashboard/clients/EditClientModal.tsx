/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  ClientItem,
  ClientDetail,
  UpdateClientPayload,
  ClientStatus,
  BillingType,
  AgentSummary,
} from '../../../types/clients';
import {
  Building2,
  Mail,
  User,
  Phone,
  DollarSign,
  Briefcase,
  Lock,
  AlertCircle,
} from 'lucide-react';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientItem | ClientDetail | null;
  onSubmit: (id: string, payload: UpdateClientPayload) => Promise<void>;
  agents: AgentSummary[];
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onSubmit,
  agents,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    companyName: string;
    contactPhone: string;
    billingType: BillingType;
    creditLimit: string;
    agentId: string;
    status: ClientStatus;
  }>({
    name: '',
    companyName: '',
    contactPhone: '',
    billingType: 'PREPAID',
    creditLimit: '0',
    agentId: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      const creditLimitVal = (client as ClientDetail).financials?.creditLimit ?? 0;
      setFormData({
        name: client.name || '',
        companyName: client.companyName || '',
        contactPhone: client.contactPhone || '',
        billingType: client.billingType || 'PREPAID',
        creditLimit: String(creditLimitVal),
        agentId: client.agentId || '',
        status: client.status || 'ACTIVE',
      });
      setErrors({});
    }
  }, [client]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Contact representative name is required.';
    }

    if (!formData.companyName.trim()) {
      errs.companyName = 'Company name is required.';
    }

    if (!formData.contactPhone.trim()) {
      errs.contactPhone = 'Contact phone number is required.';
    }

    if (formData.billingType === 'POSTPAID') {
      const credLim = parseFloat(formData.creditLimit);
      if (isNaN(credLim) || credLim < 0) {
        errs.creditLimit = 'Credit limit must be a valid non-negative number.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(client.id, {
        name: formData.name.trim(),
        companyName: formData.companyName.trim(),
        contactPhone: formData.contactPhone.trim(),
        billingType: formData.billingType,
        creditLimit: formData.billingType === 'POSTPAID' ? parseFloat(formData.creditLimit) || 0 : 0,
        agentId: formData.agentId ? formData.agentId : null,
        status: formData.status,
      });
      onClose();
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Client Profile: ${client.companyName}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Read-Only Identity Callout */}
        <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <div>
              <span className="text-[var(--text-secondary)]">Client Email (Immutable): </span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">{client.email}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
            ID: {client.id}
          </span>
        </div>

        {/* Company and Contact Person Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Company Name <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] transition-all ${
                  errors.companyName ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                }`}
              />
            </div>
            {errors.companyName && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.companyName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Primary Contact Person <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
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
        </div>

        {/* Contact Phone & Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Contact Phone <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] transition-all ${
                  errors.contactPhone ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                }`}
              />
            </div>
            {errors.contactPhone && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.contactPhone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Account Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="PENDING">PENDING</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </div>
        </div>

        {/* Commercial & Billing Parameters */}
        <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[var(--accent-emerald)]" />
            Billing & Credit Line
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                Billing Model
              </label>
              <select
                value={formData.billingType}
                onChange={(e) => setFormData({ ...formData, billingType: e.target.value as BillingType })}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
              >
                <option value="PREPAID">PREPAID (Wallet top-up)</option>
                <option value="POSTPAID">POSTPAID (Credit line / invoice)</option>
              </select>
            </div>

            {formData.billingType === 'POSTPAID' && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                  Credit Limit ($ USD)
                </label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className={`w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] ${
                    errors.creditLimit ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                  }`}
                />
                {errors.creditLimit && (
                  <p className="text-[10px] text-[var(--accent-rose)] mt-1">{errors.creditLimit}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Supervising Agent Selection */}
        <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--accent-purple)]" />
            Supervising Commercial Agent
          </label>
          <select
            value={formData.agentId}
            onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
          >
            <option value="">Unassigned (Direct Platform Operations)</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} — {agent.department || 'Operations'} ({agent.clientsCount} clients)
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
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
