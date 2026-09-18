/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  CreateClientPayload,
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
  AlertCircle,
  Shield,
} from 'lucide-react';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClientPayload) => Promise<void>;
  agents: AgentSummary[];
}

const RFC_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  agents,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    companyName: string;
    contactPhone: string;
    billingType: BillingType;
    initialBalance: string;
    creditLimit: string;
    agentId: string;
    status: ClientStatus;
  }>({
    name: '',
    email: '',
    companyName: '',
    contactPhone: '',
    billingType: 'PREPAID',
    initialBalance: '100',
    creditLimit: '0',
    agentId: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      companyName: '',
      contactPhone: '',
      billingType: 'PREPAID',
      initialBalance: '100',
      creditLimit: '0',
      agentId: '',
      status: 'ACTIVE',
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
      errs.name = 'Contact representative name is required.';
    }

    if (!formData.companyName.trim()) {
      errs.companyName = 'Company or legal organization name is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!RFC_EMAIL_REGEX.test(formData.email.trim())) {
      errs.email = 'Please provide a valid RFC-compliant email address.';
    }

    if (!formData.contactPhone.trim()) {
      errs.contactPhone = 'Contact phone number is required.';
    }

    const initBal = parseFloat(formData.initialBalance);
    if (isNaN(initBal) || initBal < 0) {
      errs.initialBalance = 'Initial balance must be a non-negative number.';
    }

    if (formData.billingType === 'POSTPAID') {
      const credLim = parseFloat(formData.creditLimit);
      if (isNaN(credLim) || credLim < 0) {
        errs.creditLimit = 'Postpaid accounts require a valid credit limit ($0 or more).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        companyName: formData.companyName.trim(),
        contactPhone: formData.contactPhone.trim(),
        billingType: formData.billingType,
        initialBalance: parseFloat(formData.initialBalance) || 0,
        creditLimit: formData.billingType === 'POSTPAID' ? parseFloat(formData.creditLimit) || 0 : 0,
        agentId: formData.agentId ? formData.agentId : null,
        status: formData.status,
      });
      handleClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAgent = agents.find((a) => a.id === formData.agentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Enterprise Client Account"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Tier Callout Banner */}
        <div className="p-3 bg-[var(--accent-blue-dim)] border border-[var(--accent-blue)]/20 rounded-xl flex items-center gap-2.5 text-xs text-[var(--accent-blue)]">
          <Shield className="w-4 h-4 shrink-0" />
          <span>
            New client will be initialized in the commercial hierarchy:{' '}
            <strong>SUPER_ADMIN → MANAGER → AGENT → CLIENT</strong>.
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
                placeholder="e.g. Alpha Express Logistics Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] transition-all ${
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
              Primary Contact Name <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="e.g. Marcus Vance"
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
        </div>

        {/* Email and Phone Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Billing & Operations Email <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="email"
                placeholder="e.g. billing@alphaexpress.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] transition-all ${
                  errors.email ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Contact Phone <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="e.g. +44 20 7946 0912"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className={`w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] transition-all ${
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
        </div>

        {/* Commercial Model & Financial Allocation */}
        <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[var(--accent-emerald)]" />
              Commercial & Billing Configuration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                Initial Balance ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                className={`w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] ${
                  errors.initialBalance ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
                }`}
              />
              {errors.initialBalance && (
                <p className="text-[10px] text-[var(--accent-rose)] mt-1">{errors.initialBalance}</p>
              )}
            </div>

            {formData.billingType === 'POSTPAID' ? (
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
            ) : (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING REVIEW</option>
                </select>
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

          {selectedAgent && (
            <div className="p-2.5 rounded-lg bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Agent Email:</span>
                <span className="font-mono text-[var(--text-primary)]">{selectedAgent.email}</span>
              </div>
              {selectedAgent.managerName && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Supervising Manager:</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedAgent.managerName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
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
            Create Client
          </Button>
        </div>
      </form>
    </Modal>
  );
};
