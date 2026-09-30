/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Building2,
  Search,
  Plus,
  ArrowRight,
  Shield,
  CheckCircle2,
  Mail,
  Phone,
  Hash,
  Wallet,
  Layers,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface TeamAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  clientsCount: number;
  allocatedNumbers: number;
  monthlySmsVolume: number;
  quotaLimit: number;
  status: 'ACTIVE' | 'IDLE';
}

interface TeamClient {
  id: string;
  name: string;
  company: string;
  email: string;
  assignedAgentName: string;
  leasedNumbers: number;
  walletBalance: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

const INITIAL_AGENTS: TeamAgent[] = [
  {
    id: 'AGT-01',
    name: 'AAbuzar (Primary Agent)',
    email: 'agent@smshub.local',
    phone: '+44 7911 123456',
    clientsCount: 8,
    allocatedNumbers: 6500,
    monthlySmsVolume: 184200,
    quotaLimit: 8000,
    status: 'ACTIVE',
  },
  {
    id: 'AGT-02',
    name: 'Alex Rivera',
    email: 'alex@smshub.local',
    phone: '+1 202 555 0192',
    clientsCount: 4,
    allocatedNumbers: 3200,
    monthlySmsVolume: 74100,
    quotaLimit: 5000,
    status: 'ACTIVE',
  },
  {
    id: 'AGT-03',
    name: 'Sarah Chen',
    email: 'sarah@smshub.local',
    phone: '+49 151 2345678',
    clientsCount: 4,
    allocatedNumbers: 3800,
    monthlySmsVolume: 68500,
    quotaLimit: 4000,
    status: 'ACTIVE',
  },
  {
    id: 'AGT-04',
    name: 'Marcus Vance',
    email: 'marcus@smshub.local',
    phone: '+46 70 123 4567',
    clientsCount: 2,
    allocatedNumbers: 750,
    monthlySmsVolume: 16090,
    quotaLimit: 2500,
    status: 'IDLE',
  },
];

const INITIAL_CLIENTS: TeamClient[] = [
  {
    id: 'CLT-01',
    name: 'Acme Telematics Corp',
    company: 'Acme Telematics Ltd',
    email: 'client@smshub.local',
    assignedAgentName: 'AAbuzar (Primary Agent)',
    leasedNumbers: 12,
    walletBalance: 245.8,
    status: 'ACTIVE',
  },
  {
    id: 'CLT-02',
    name: 'Fintech Solutions UK',
    company: 'Fintech UK Ltd',
    email: 'billing@fintechuk.io',
    assignedAgentName: 'AAbuzar (Primary Agent)',
    leasedNumbers: 8,
    walletBalance: 820.0,
    status: 'ACTIVE',
  },
  {
    id: 'CLT-03',
    name: 'Nordic Logistics AB',
    company: 'Nordic Logistics Group',
    email: 'ops@nordiclogistics.se',
    assignedAgentName: 'Sarah Chen',
    leasedNumbers: 15,
    walletBalance: 1420.5,
    status: 'ACTIVE',
  },
  {
    id: 'CLT-04',
    name: 'PayFlow Global',
    company: 'PayFlow Corp',
    email: 'api@payflow.global',
    assignedAgentName: 'Alex Rivera',
    leasedNumbers: 6,
    walletBalance: 310.25,
    status: 'ACTIVE',
  },
  {
    id: 'CLT-05',
    name: 'Berlin Mobility Tech',
    company: 'Berlin Mobility GmbH',
    email: 'infra@berlin-mobility.de',
    assignedAgentName: 'Alex Rivera',
    leasedNumbers: 4,
    walletBalance: 88.0,
    status: 'ACTIVE',
  },
];

export const ManagerTeamView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AGENTS' | 'CLIENTS'>('AGENTS');
  const [agents] = useState<TeamAgent[]>(INITIAL_AGENTS);
  const [clients, setClients] = useState<TeamClient[]>(INITIAL_CLIENTS);
  const [search, setSearch] = useState<string>('');

  const [assignModalClient, setAssignModalClient] = useState<TeamClient | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string>(INITIAL_AGENTS[0].name);

  const handleSaveReassignment = () => {
    if (!assignModalClient) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === assignModalClient.id ? { ...c, assignedAgentName: selectedAgentName } : c
      )
    );
    setAssignModalClient(null);
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.assignedAgentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 glass-card border-[rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <Users className="w-3.5 h-3.5 mr-1" />
                Team Roster & Account Portfolios
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                WORLD SMS SERVICE Team Management
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              My Team & Portfolio
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Manage your assigned agents, supervise client accounts, rebalance workloads, and inspect performance quotas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)]">
            <span>{agents.length} Agents</span>
            <span>&bull;</span>
            <span>{clients.length} Clients</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('AGENTS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'AGENTS'
                ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
            }`}
          >
            Assigned Agents ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'CLIENTS'
                ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
            }`}
          >
            Managed Clients ({clients.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder={activeTab === 'AGENTS' ? 'Search agents...' : 'Search clients or companies...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      {/* Content for Agents */}
      {activeTab === 'AGENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => {
            const usagePercent = Math.min(100, Math.round((agent.allocatedNumbers / agent.quotaLimit) * 100));
            return (
              <div
                key={agent.id}
                className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] hover:border-[rgba(59,130,246,0.3)] transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">{agent.name}</div>
                      <div className="text-xs text-[var(--text-tertiary)] font-mono flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{agent.email}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                    {agent.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-[rgba(0,0,0,0.15)] rounded-xl border border-[var(--glass-border)] text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Clients</div>
                    <div className="font-mono font-bold text-sm text-[var(--text-primary)] mt-0.5">
                      {agent.clientsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Numbers</div>
                    <div className="font-mono font-bold text-sm text-[var(--text-primary)] mt-0.5">
                      {agent.allocatedNumbers.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-tertiary)] uppercase">SMS Vol</div>
                    <div className="font-mono font-bold text-sm text-[var(--accent-blue)] mt-0.5">
                      {agent.monthlySmsVolume.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>Range Quota Allocation</span>
                    <span className="font-mono">
                      {agent.allocatedNumbers.toLocaleString()} / {agent.quotaLimit.toLocaleString()} ({usagePercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--glass-bg)] h-2 rounded-full overflow-hidden border border-[var(--glass-border)]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent > 85 ? 'bg-amber-400' : 'bg-[var(--accent-blue)]'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content for Clients */}
      {activeTab === 'CLIENTS' && (
        <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[rgba(0,0,0,0.2)] border-b border-[var(--glass-border)] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-5">Client Company</th>
                  <th className="p-3.5">Assigned Agent</th>
                  <th className="p-3.5">Leased Numbers</th>
                  <th className="p-3.5">Wallet Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="font-semibold text-[var(--text-primary)]">{client.company}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">{client.email}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                        <span className="font-medium text-[var(--text-primary)]">{client.assignedAgentName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[var(--text-primary)]">
                      {client.leasedNumbers} numbers
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[var(--accent-emerald)]">
                      ${client.walletBalance.toFixed(2)} USD
                    </td>
                    <td className="p-3.5">
                      <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                        {client.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => {
                          setAssignModalClient(client);
                          setSelectedAgentName(client.assignedAgentName);
                        }}
                        className="px-2.5 py-1 text-xs text-[var(--accent-blue)] hover:bg-[var(--accent-blue-dim)] rounded-lg transition-colors font-medium border border-[rgba(59,130,246,0.2)] cursor-pointer"
                      >
                        Reassign Agent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reassign Agent Modal */}
      {assignModalClient && (
        <Modal
          isOpen={true}
          onClose={() => setAssignModalClient(null)}
          title={`Reassign Agent: ${assignModalClient.company}`}
          subtitle="Change the supervisory agent responsible for managing this client"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-[var(--text-primary)]">Select Agent:</label>
              <select
                value={selectedAgentName}
                onChange={(e) => setSelectedAgentName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({a.clientsCount} clients)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)]">
              This client will now be managed by <span className="font-semibold text-[var(--text-primary)]">{selectedAgentName}</span>. Number routing and commission attribution will update immediately.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--glass-border)]">
              <Button variant="outline" size="sm" onClick={() => setAssignModalClient(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveReassignment}>
                Save Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
