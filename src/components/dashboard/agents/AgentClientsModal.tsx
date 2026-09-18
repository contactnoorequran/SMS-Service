/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { AgentItem, AgentClientSummary } from '../../../types/agents';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  Building2,
  Search,
  ExternalLink,
  Hash,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface AgentClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentItem | null;
  clients: AgentClientSummary[];
}

export const AgentClientsModal: React.FC<AgentClientsModalProps> = ({
  isOpen,
  onClose,
  agent,
  clients,
}) => {
  const [search, setSearch] = useState('');

  if (!agent) return null;

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Client Portfolio — ${agent.name}`}
      description="Enterprise client accounts managed directly by this commercial agent."
      size="lg"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter clients by name, company, or email..."
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-glass-input)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />
          </div>

          <div className="text-xs text-[var(--text-secondary)] shrink-0">
            Total Accounts: <strong className="text-[var(--text-primary)]">{clients.length}</strong>
          </div>
        </div>

        {/* Client Table */}
        <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No client accounts match your query.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-glass-card)] text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--border-subtle)] sticky top-0">
                <tr>
                  <th className="px-4 py-3">Client Account</th>
                  <th className="px-4 py-3">Billing</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Numbers</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--text-primary)]">{client.companyName}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{client.name} • {client.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={client.billingType === 'PREPAID' ? 'info' : 'purple'} size="sm">
                        {client.billingType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={client.status === 'ACTIVE' ? 'success' : 'error'} size="sm">
                        {client.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                      {client.assignedNumbersCount} numbers
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--text-primary)]">
                      {formatCurrency(client.balance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Client profile for ${client.companyName} will be available in the Client Management module.`);
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label={`View client ${client.companyName}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-[var(--border-subtle)]">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
