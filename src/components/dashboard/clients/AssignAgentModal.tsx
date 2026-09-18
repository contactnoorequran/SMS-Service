/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ClientItem, ClientDetail, AgentSummary } from '../../../types/clients';
import {
  Briefcase,
  UserCheck,
  Building2,
  CheckCircle2,
  Users,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientItem | ClientDetail | null;
  agents: AgentSummary[];
  onConfirm: (clientId: string, agentId: string | null) => Promise<void>;
}

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({
  isOpen,
  onClose,
  client,
  agents,
  onConfirm,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => client?.agentId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when client changes
  React.useEffect(() => {
    if (client) {
      setSelectedAgentId(client.agentId || '');
    }
  }, [client]);

  if (!client) return null;

  const currentAgent = agents.find((a) => a.id === client.agentId);
  const targetAgent = agents.find((a) => a.id === selectedAgentId);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(client.id, selectedAgentId ? selectedAgentId : null);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Supervising Agent"
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Client Target Banner */}
        <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)]">{client.companyName}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">{client.email}</div>
            </div>
          </div>
          <Badge variant="neutral" size="sm">
            {client.billingType}
          </Badge>
        </div>

        {/* Current vs Target Agent Preview */}
        <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-semibold">
              Current Agent
            </span>
            <div className="font-semibold text-[var(--text-primary)] mt-0.5">
              {currentAgent ? currentAgent.name : 'Unassigned (Direct)'}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {currentAgent ? currentAgent.department || 'Operations' : 'No supervisor'}
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />

          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-semibold">
              Target Agent
            </span>
            <div className="font-semibold text-[var(--accent-blue)] mt-0.5">
              {targetAgent ? targetAgent.name : 'Unassigned (Direct)'}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {targetAgent ? targetAgent.department || 'Operations' : 'Direct operations'}
            </span>
          </div>
        </div>

        {/* Agent Selection List */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
            Select Commercial Field Agent
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {/* Direct Platform Option */}
            <div
              onClick={() => setSelectedAgentId('')}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                selectedAgentId === ''
                  ? 'bg-[var(--accent-blue-dim)] border-[var(--accent-blue)]/40 shadow-sm'
                  : 'bg-[var(--bg-glass-card)] border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  Platform Direct (Unassigned)
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Managed directly by Head of Operations
                </div>
              </div>
              {selectedAgentId === '' && (
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-blue)]" />
              )}
            </div>

            {/* List of Agents */}
            {agents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              const maxClients = agent.maxClients || 20;
              const loadPercentage = Math.round((agent.clientsCount / maxClients) * 100);

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--accent-purple-dim)] border-[var(--accent-purple)]/40 shadow-sm'
                      : 'bg-[var(--bg-glass-card)] border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {agent.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-muted)] font-mono border border-[var(--border-subtle)]">
                        {agent.department || 'Operations'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Manager: {agent.managerName || 'Direct'} • {agent.clientsCount}/{maxClients} clients ({loadPercentage}% capacity)
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        loadPercentage >= 90
                          ? 'bg-[var(--accent-rose-dim)] text-[var(--accent-rose)] border-[var(--accent-rose)]/20'
                          : loadPercentage >= 75
                          ? 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border-[var(--accent-amber)]/20'
                          : 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]/20'
                      }`}
                    >
                      {agent.clientsCount} accounts
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent-purple)]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hierarchy Summary Callout */}
        {targetAgent && (
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Resulting Hierarchy
            </span>
            <div className="text-[var(--text-secondary)]">
              Client: <strong>{client.companyName}</strong> → Agent: <strong>{targetAgent.name}</strong> → Supervising Manager: <strong>{targetAgent.managerName || 'Sarah Khan'}</strong>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
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
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            Confirm Reassignment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
