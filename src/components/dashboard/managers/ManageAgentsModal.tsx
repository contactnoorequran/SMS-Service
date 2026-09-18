/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { CapacityIndicator } from './CapacityIndicator';
import { ManagerItem, ManagerAgentItem, AgentPoolItem } from '../../../types/managers';
import {
  Users,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle2,
  Search,
  Shield,
} from 'lucide-react';

interface ManageAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerItem | null;
  assignedAgents: ManagerAgentItem[];
  availableAgents: AgentPoolItem[];
  onAssign: (managerId: string, agentId: string) => Promise<void>;
  onUnassign: (managerId: string, agentId: string) => Promise<void>;
}

export const ManageAgentsModal: React.FC<ManageAgentsModalProps> = ({
  isOpen,
  onClose,
  manager,
  assignedAgents,
  availableAgents,
  onAssign,
  onUnassign,
}) => {
  const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  if (!manager) return null;

  const isFull = manager.assignedAgentsCount >= manager.maxAgents;

  // Filter lists
  const filteredAssigned = assignedAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unassignedPool = availableAgents.filter(
    (a) =>
      a.assignedManagerId !== manager.id &&
      (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssign = async (agentId: string) => {
    setIsProcessingId(agentId);
    try {
      await onAssign(manager.id, agentId);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleUnassign = async (agentId: string) => {
    setIsProcessingId(agentId);
    try {
      await onUnassign(manager.id, agentId);
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Agents — ${manager.name}`}
      description="Supervise team allocation, assign available agents, or unassign agents to free up quota capacity."
      size="lg"
    >
      <div className="space-y-4">
        {/* Capacity Overview Card */}
        <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent-blue)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                {manager.department} Team Quota
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Available Slots: <strong className="text-[var(--text-primary)]">{manager.availableSlots}</strong>
            </div>
          </div>

          <CapacityIndicator current={manager.assignedAgentsCount} max={manager.maxAgents} size="md" />

          {isFull && (
            <div className="p-2.5 bg-[var(--accent-amber-dim)] border border-[var(--accent-amber)]/30 rounded-lg flex items-center gap-2 text-xs text-[var(--accent-amber)]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Maximum capacity reached ({manager.maxAgents} agents). Unassign an agent or expand manager quota to assign additional agents.
              </span>
            </div>
          )}
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center bg-[var(--bg-glass-input)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setActiveTab('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'assigned'
                  ? 'bg-[var(--bg-glass-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Assigned Agents ({assignedAgents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'available'
                  ? 'bg-[var(--bg-glass-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Available Pool ({unassignedPool.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agent name/email..."
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />
          </div>
        </div>

        {/* Tab 1: Assigned Agents */}
        {activeTab === 'assigned' && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredAssigned.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-muted)]">
                No agents assigned to this manager matching your filter.
              </div>
            ) : (
              filteredAssigned.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between hover:border-[var(--border-strong)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs shrink-0">
                      {agent.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {agent.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                        {agent.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-[var(--text-secondary)] hidden sm:inline">
                      {agent.clientsCount} clients
                    </span>
                    <Badge variant="success" size="sm">
                      ASSIGNED
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnassign(agent.id)}
                      isLoading={isProcessingId === agent.id}
                      aria-label={`Unassign ${agent.name}`}
                      className="text-[var(--accent-rose)] hover:border-[var(--accent-rose)]/50"
                    >
                      <UserMinus className="w-3.5 h-3.5 mr-1" />
                      Unassign
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Available Pool */}
        {activeTab === 'available' && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {unassignedPool.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-muted)]">
                No unassigned agents available in the pool.
              </div>
            ) : (
              unassignedPool.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between hover:border-[var(--border-strong)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-glass-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs shrink-0">
                      {agent.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {agent.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                        {agent.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {agent.assignedManagerName ? (
                      <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                        Currently: {agent.assignedManagerName}
                      </span>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        UNASSIGNED
                      </Badge>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAssign(agent.id)}
                      disabled={isFull}
                      isLoading={isProcessingId === agent.id}
                      aria-label={`Assign ${agent.name}`}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Assign
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
