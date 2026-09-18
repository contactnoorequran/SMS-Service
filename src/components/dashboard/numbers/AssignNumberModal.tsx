/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  NumberItem,
  NumberDetail,
  NumberClientSummary,
  NumberAgentSummary,
  AssignNumberPayload,
} from '../../../types/numbers';
import { Hash, Building2, User, FileText, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface AssignNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  number: NumberItem | NumberDetail | null;
  clients: NumberClientSummary[];
  agents: NumberAgentSummary[];
  onSubmit: (numberId: string, payload: AssignNumberPayload) => Promise<void>;
}

export const AssignNumberModal: React.FC<AssignNumberModalProps> = ({
  isOpen,
  onClose,
  number,
  clients,
  agents,
  onSubmit,
}) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!number) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Please select an enterprise client account');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(number.id, {
        clientId: selectedClientId,
        agentId: selectedAgentId ? selectedAgentId : null,
        reason: reason.trim() || undefined,
        assignedBy: 'admin@smshub.local',
      });
      onClose();
      // Reset form
      setSelectedClientId('');
      setSelectedAgentId('');
      setReason('');
    } catch (err: any) {
      setError(err?.message || 'Failed to allocate phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate Phone Number to Client">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Number Target Card */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{number.country.flag || '🌐'}</span>
              <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                {number.e164}
              </span>
            </div>
            <Badge variant={number.status === 'AVAILABLE' ? 'success' : 'warning'}>
              {number.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono">
            <span>{number.country.name}</span>
            <span>•</span>
            <span>{number.operator?.name || 'Standard Telco'}</span>
            <span>•</span>
            <span>{number.provider.name}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Client Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            Target Enterprise Client Account *
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setError(null);
            }}
            required
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          >
            <option value="">Select a Client Account...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} ({c.email})
              </option>
            ))}
          </select>
        </div>

        {/* Supervising Agent Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
            Commercial Supervising Agent (Optional)
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          >
            <option value="">Platform Direct / No Supervising Agent</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.email})
              </option>
            ))}
          </select>
        </div>

        {/* Allocation Reason */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            Operational Allocation Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Dedicated 2FA OTP ingress channel"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        {/* Allocation Preview Callout */}
        {selectedClient && (
          <div className="p-3 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--accent-blue)]/20 space-y-1.5 text-xs">
            <div className="font-semibold text-[var(--accent-blue)] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              ActiveAssignment Lifecycle Binding
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Upon allocation, inbound traffic to <strong className="text-[var(--text-primary)] font-mono">{number.e164}</strong> will be immediately routed to{' '}
              <strong className="text-[var(--text-primary)]">{selectedClient.companyName}</strong>&apos;s webhook endpoint. A permanent historical audit record will be created.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} disabled={!selectedClientId}>
            <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
            Confirm Allocation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
