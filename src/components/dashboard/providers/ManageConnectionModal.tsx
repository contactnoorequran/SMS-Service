/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  ProviderDetail,
  ProviderConnectionSummary,
  ProviderConnectionType,
  CreateConnectionPayload,
  UpdateConnectionPayload,
} from '../../../types/providers';
import {
  Server,
  Shield,
  ShieldCheck,
  Radio,
  AlertCircle,
  Lock,
  Zap,
} from 'lucide-react';

interface ManageConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderDetail | null;
  connectionToEdit?: ProviderConnectionSummary | null;
  onSubmit: (
    providerId: string,
    payload: CreateConnectionPayload | UpdateConnectionPayload,
    connectionId?: string
  ) => Promise<void>;
}

export const ManageConnectionModal: React.FC<ManageConnectionModalProps> = ({
  isOpen,
  onClose,
  provider,
  connectionToEdit,
  onSubmit,
}) => {
  const isEditing = !!connectionToEdit;

  const [formData, setFormData] = useState<{
    name: string;
    connectionType: ProviderConnectionType;
    environment: 'PRODUCTION' | 'SANDBOX';
    host: string;
    port: string;
    priority: string;
    tlsEnabled: boolean;
    credentialRefLabel: string;
  }>({
    name: '',
    connectionType: 'SMPP_TRANSCEIVER',
    environment: 'PRODUCTION',
    host: '',
    port: '2775',
    priority: '1',
    tlsEnabled: true,
    credentialRefLabel: 'Primary KMS Vault Reference',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (connectionToEdit) {
      setFormData({
        name: connectionToEdit.name || '',
        connectionType: connectionToEdit.connectionType || 'SMPP_TRANSCEIVER',
        environment: connectionToEdit.environment || 'PRODUCTION',
        host: connectionToEdit.host || '',
        port: String(connectionToEdit.port || (connectionToEdit.connectionType === 'HTTP_REST' ? 443 : 2775)),
        priority: String(connectionToEdit.priority || 1),
        tlsEnabled: connectionToEdit.tlsEnabled ?? true,
        credentialRefLabel: connectionToEdit.credential?.label || 'Primary KMS Vault Reference',
      });
      setErrors({});
    } else {
      setFormData({
        name: '',
        connectionType: 'SMPP_TRANSCEIVER',
        environment: 'PRODUCTION',
        host: '',
        port: '2775',
        priority: '1',
        tlsEnabled: true,
        credentialRefLabel: 'Primary KMS Vault Reference',
      });
      setErrors({});
    }
  }, [connectionToEdit, isOpen]);

  const handleTypeChange = (type: ProviderConnectionType) => {
    setFormData((prev) => ({
      ...prev,
      connectionType: type,
      port: type === 'HTTP_REST' ? '443' : '2775',
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Connection name / label is required.';
    }

    if (!formData.host.trim()) {
      errs.host = 'Carrier gateway host or endpoint URL is required.';
    }

    const portNum = parseInt(formData.port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errs.port = 'Port must be between 1 and 65535.';
    }

    const prioNum = parseInt(formData.priority, 10);
    if (isNaN(prioNum) || prioNum < 1) {
      errs.priority = 'Priority must be 1 or higher.';
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
      if (isEditing && connectionToEdit) {
        await onSubmit(
          provider.id,
          {
            name: formData.name.trim(),
            connectionType: formData.connectionType,
            environment: formData.environment,
            host: formData.host.trim(),
            port: parseInt(formData.port, 10),
            priority: parseInt(formData.priority, 10),
            tlsEnabled: formData.tlsEnabled,
          },
          connectionToEdit.id
        );
      } else {
        await onSubmit(provider.id, {
          name: formData.name.trim(),
          connectionType: formData.connectionType,
          environment: formData.environment,
          host: formData.host.trim(),
          port: parseInt(formData.port, 10),
          priority: parseInt(formData.priority, 10),
          tlsEnabled: formData.tlsEnabled,
          credentialRefLabel: formData.credentialRefLabel.trim() || undefined,
        });
      }
      onClose();
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!provider) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Connection: ${connectionToEdit?.name}` : `Add Carrier Connection Bind to ${provider.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Credential Reference Info Banner */}
        <div className="p-3 bg-[var(--accent-blue-dim)] border border-[var(--accent-blue)]/20 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--accent-blue)] shrink-0" />
            <span className="text-[var(--accent-blue)]">
              Authentication uses safe <strong>KMS Vault Credential References</strong>. Raw passwords and access tokens are never accepted in plain web forms.
            </span>
          </div>
        </div>

        {/* Connection Name & Protocol Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Connection Name / Label <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <div className="relative">
              <Server className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="e.g. Frankfurt Primary Direct SMPP TX"
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
              Connection Protocol
            </label>
            <select
              value={formData.connectionType}
              onChange={(e) => handleTypeChange(e.target.value as ProviderConnectionType)}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            >
              <option value="SMPP_TRANSCEIVER">SMPP_TRANSCEIVER (Two-Way Dual TX/RX)</option>
              <option value="SMPP_TRANSMITTER">SMPP_TRANSMITTER (Dedicated Outbound TX)</option>
              <option value="SMPP_RECEIVER">SMPP_RECEIVER (Dedicated Inbound RX)</option>
              <option value="HTTP_REST">HTTP_REST (JSON / HTTPS Webhooks)</option>
            </select>
          </div>
        </div>

        {/* Host, Port & Environment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Carrier Host / FQDN <span className="text-[var(--accent-rose)]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. smpp.fra.sinch.com or api.carrier.com"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className={`w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] font-mono focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] ${
                errors.host ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              }`}
            />
            {errors.host && (
              <p className="text-[11px] text-[var(--accent-rose)] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.host}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Port
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              className={`w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border rounded-xl text-[var(--text-primary)] font-mono focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)] ${
                errors.port ? 'border-[var(--accent-rose)]' : 'border-[var(--border-subtle)]'
              }`}
            />
          </div>
        </div>

        {/* Environment, Priority & TLS */}
        <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'PRODUCTION' | 'SANDBOX' })}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
              >
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="SANDBOX">SANDBOX / STAGING</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 font-medium">
                Routing Priority (1 = High)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.tlsEnabled}
                  onChange={(e) => setFormData({ ...formData, tlsEnabled: e.target.checked })}
                  className="rounded border-[var(--border-subtle)] text-[var(--accent-blue)] focus:ring-0"
                />
                <span className="font-medium text-[var(--text-primary)]">TLS Encryption Enforced</span>
              </label>
            </div>
          </div>
        </div>

        {/* KMS Credential Reference Metadata */}
        {!isEditing && (
          <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-emerald)]" />
              KMS Vault Key Label
            </label>
            <input
              type="text"
              placeholder="e.g. Frankfurt Primary Carrier KMS Vault Key"
              value={formData.credentialRefLabel}
              onChange={(e) => setFormData({ ...formData, credentialRefLabel: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent-blue)]"
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              An encrypted reference ID will be minted in the secrets vault upon creation.
            </p>
          </div>
        )}

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
            {isEditing ? 'Save Connection' : 'Bind Connection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
