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
  ReassignNumberPayload,
} from '../../../types/numbers';
import { formatDate } from '../../../utils/formatters';
import { Hash, Building2, User, FileText, AlertCircle, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

interface ReassignNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  number: NumberItem | NumberDetail | null;
  clients: NumberClientSummary[];
  agents: NumberAgentSummary[];
  onSubmit: (numberId: string, payload: ReassignNumberPayload) => Promise<void>;
}

export const ReassignNumberModal: React.FC<ReassignNumberModalProps> = ({
  isOpen,
  onClose,
  number,
  clients,
  agents,
  onSubmit,
}) => {
  const [targetClientId, setTargetClientId] = useState('');
  const [targetAgentId, setTargetAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!number || !number.activeAssignment) return null;

  const currentAssignment = number.activeAssignment;
  const targetClient = clients.find((c) => c.id === targetClientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClientId) {
      setError('Please select a new enterprise client account');
      return;
    }
    if (targetClientId === currentAssignment.clientId) {
      setError('Target client cannot be the same as current client. Use assignment modification instead.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(number.id, {
        targetClientId,
        targetAgentId: targetAgentId ? targetAgentId : null,
        reason: reason.trim() || undefined,
        changedBy: 'admin@smshub.local',
      });
      onClose();
      // Reset form
      setTargetClientId('');
      setTargetAgentId('');
      setReason('');
    } catch (err: any) {
      setError(err?.message || 'Failed to reassign phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reassign Phone Number">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Number Header */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{number.country.flag || '🌐'}</span>
              <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                {number.e164}
              </span>
            </div>
            <Badge variant="warning">REASSIGNMENT</Badge>
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-mono">
            {number.country.name} • {number.provider.name}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 text-[var(--accent-rose)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current vs Target Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Current Assignment */}
          <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] space-y-1.5 text-xs">
            <span className="text-[10px] font-mono text-[var(--accent-rose)] font-semibold uppercase tracking-wider">
              Current Assignment (Will Be Closed)
            </span>
            <div className="font-semibold text-[var(--text-primary)]">
              {currentAssignment.client.companyName}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Agent: {currentAssignment.agent ? currentAssignment.agent.name : 'None'}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              Assigned: {formatDate(currentAssignment.assignedAt)}
            </div>
          </div>

          {/* Target Assignment */}
          <div className="p-3 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--accent-blue)]/20 space-y-1.5 text-xs">
            <span className="text-[10px] font-mono text-[var(--accent-blue)] font-semibold uppercase tracking-wider">
              Target Assignment (New Owner)
            </span>
            <div className="font-semibold text-[var(--text-primary)]">
              {targetClient ? targetClient.companyName : 'Select target client below'}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Effective immediately upon confirmation
            </div>
          </div>
        </div>

        {/* Target Client Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            New Enterprise Client *
          </label>
          <select
            value={targetClientId}
            onChange={(e) => {
              setTargetClientId(e.target.value);
              setError(null);
            }}
            required
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          >
            <option value="">Select New Client Account...</option>
            {clients
              .filter((c) => c.id !== currentAssignment.clientId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.email})
                </option>
              ))}
          </select>
        </div>

        {/* Target Agent Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
            Supervising Agent for New Assignment (Optional)
          </label>
          <select
            value={targetAgentId}
            onChange={(e) => setTargetAgentId(e.target.value)}
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

        {/* Reassignment Reason */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            Reassignment Reason / Ticket ID *
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Account consolidation under ticket INC-4921"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
          />
        </div>

        {/* Operational Impact Warning */}
        <div className="p-3 rounded-xl bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)]/20 flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
          <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)] shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="text-[var(--text-primary)] font-semibold block mb-0.5">
              Immediate Traffic Rerouting Impact
            </strong>
            The current active assignment for {currentAssignment.client.companyName} will be closed in historical records with an ended timestamp. All incoming SMS messages will instantaneously reroute to the new client.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} disabled={!targetClientId || !reason.trim()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Confirm Reassignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
