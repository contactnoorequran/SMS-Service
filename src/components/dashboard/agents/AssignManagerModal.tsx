/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CapacityIndicator } from '../managers/CapacityIndicator';
import { AgentItem, ManagerSummary } from '../../../types/agents';
import {
  UserCheck,
  Building,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Users,
  Shield,
} from 'lucide-react';

interface AssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentItem | null;
  managers: ManagerSummary[];
  onConfirm: (agentId: string, managerId: string | null) => Promise<void>;
}

export const AssignManagerModal: React.FC<AssignManagerModalProps> = ({
  isOpen,
  onClose,
  agent,
  managers,
  onConfirm,
}) => {
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    agent?.managerId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected manager on open
  React.useEffect(() => {
    if (agent) {
      setSelectedManagerId(agent.managerId || '');
    }
  }, [agent]);

  if (!agent) return null;

  const currentManager = managers.find((m) => m.id === agent.managerId) || null;
  const newManager = managers.find((m) => m.id === selectedManagerId) || null;

  const isChanging = (agent.managerId || '') !== selectedManagerId;
  const isSelectedFull = newManager ? newManager.availableSlots <= 0 && newManager.id !== agent.managerId : false;

  const handleAssign = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(agent.id, selectedManagerId || null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supervising Manager Assignment"
      description={`Allocate or reassign supervisory responsibility for agent ${agent.name}.`}
      size="md"
    >
      <div className="space-y-4">
        {/* Manager Transition Preview */}
        <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Current Manager</div>
            {currentManager ? (
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">{currentManager.name}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{currentManager.department}</div>
              </div>
            ) : (
              <Badge variant="neutral" size="sm">Unassigned</Badge>
            )}
          </div>

          <div className="flex items-center text-[var(--text-muted)] px-2">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">New Manager</div>
            {newManager ? (
              <div>
                <div className="text-xs font-bold text-[var(--accent-blue)]">{newManager.name}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{newManager.department}</div>
              </div>
            ) : (
              <Badge variant="neutral" size="sm">Unassigned (Direct)</Badge>
            )}
          </div>
        </div>

        {/* Manager Selection List with Capacity Indicators */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--text-secondary)]">
            Select Supervising Manager
          </label>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {/* Direct Unassigned Option */}
            <div
              onClick={() => setSelectedManagerId('')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedManagerId === ''
                  ? 'bg-[var(--accent-blue-dim)] border-[var(--accent-blue)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-glass-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Unassigned (Direct Pool)</span>
                {selectedManagerId === '' && <CheckCircle2 className="w-4 h-4 text-[var(--accent-blue)]" />}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Agent reports directly to platform operations without an intermediary manager.
              </p>
            </div>

            {/* Available Managers List */}
            {managers.map((mgr) => {
              const isSelected = selectedManagerId === mgr.id;
              const isCurrent = agent.managerId === mgr.id;
              const isFull = mgr.availableSlots <= 0 && !isCurrent;

              return (
                <div
                  key={mgr.id}
                  onClick={() => !isFull && setSelectedManagerId(mgr.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    isFull ? 'opacity-50 cursor-not-allowed bg-[var(--bg-glass-card)] border-[var(--border-subtle)]' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-[var(--accent-blue-dim)] border-[var(--accent-blue)] text-[var(--text-primary)]'
                      : 'bg-[var(--bg-glass-card)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{mgr.name}</span>
                        {isCurrent && <Badge variant="info" size="sm">Current</Badge>}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">{mgr.department}</div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono ${
                          mgr.availableSlots > 0 ? 'text-[var(--accent-emerald)]' : 'text-[var(--accent-rose)]'
                        }`}
                      >
                        {mgr.availableSlots} slots left
                      </span>
                    </div>
                  </div>

                  <CapacityIndicator
                    current={mgr.assignedAgentsCount}
                    max={mgr.maxAgents}
                    size="sm"
                    showLabels={false}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning if capacity exceeded */}
        {isSelectedFull && (
          <div className="p-3 bg-[var(--accent-rose-dim)] border border-[var(--accent-rose)]/30 rounded-xl flex items-center gap-2 text-xs text-[var(--accent-rose)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Selected manager has reached 100% capacity. Please select another supervisor.</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAssign}
            disabled={!isChanging || isSelectedFull}
            isLoading={isSubmitting}
          >
            Confirm Reassignment
          </Button>
        </div>
      </div>
    </Modal>
  );
};
