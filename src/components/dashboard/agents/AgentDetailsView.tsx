/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { AgentDetail, AgentStatus } from '../../../types/agents';
import { formatDate, formatRelativeTime, formatCurrency, formatPercent } from '../../../utils/formatters';
import {
  ArrowLeft,
  Mail,
  Building,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  Users,
  Edit2,
  Power,
  UserCheck,
  ExternalLink,
  CheckCircle2,
  Lock,
  Hash,
  DollarSign,
  TrendingUp,
  Activity,
  Briefcase,
} from 'lucide-react';

interface AgentDetailsViewProps {
  agent: AgentDetail;
  onBack: () => void;
  onEdit: (agent: AgentDetail) => void;
  onStatusChange: (agent: AgentDetail) => void;
  onAssignManager: (agent: AgentDetail) => void;
  onViewClients: (agent: AgentDetail) => void;
}

const AGENT_PERMISSION_GROUPS = [
  {
    module: 'Client Portfolio',
    permissions: [
      { code: 'clients.read', label: 'View Client Profiles', desc: 'Read-only access to assigned clients' },
    ],
  },
  {
    module: 'Number Inventory',
    permissions: [
      { code: 'numbers.read', label: 'Inspect Numbers', desc: 'View assigned E.164 phone numbers' },
    ],
  },
  {
    module: 'Messaging Traffic',
    permissions: [
      { code: 'messages.read', label: 'Inbound SMS Stream', desc: 'View message activity for clients' },
      { code: 'cdr.read', label: 'Call Records (CDR)', desc: 'Inspect delivery statistics' },
    ],
  },
  {
    module: 'Commercial Rates',
    permissions: [
      { code: 'rates.read', label: 'Client Rate Cards', desc: 'Inspect retail pricing rules' },
    ],
  },
];

export const AgentDetailsView: React.FC<AgentDetailsViewProps> = ({
  agent,
  onBack,
  onEdit,
  onStatusChange,
  onAssignManager,
  onViewClients,
}) => {
  const getStatusBadgeVariant = (status: AgentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'SUSPENDED':
      case 'DISABLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const initials = (agent?.name || 'Agent')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const clientsList = Array.isArray(agent?.clients) ? agent.clients : [];
  const activeClients = clientsList.filter((c) => c?.status === 'ACTIVE').length;
  const suspendedClients = clientsList.filter((c) => c?.status === 'SUSPENDED').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Management', onClick: onBack },
              { label: 'Agents', onClick: onBack },
              { label: agent.name },
            ]}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Back to Agents directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              {agent.name}
            </h1>
            <Badge variant={getStatusBadgeVariant(agent.status)} size="md">
              {agent.status}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(agent)}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onAssignManager(agent)}>
            <UserCheck className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-blue)]" />
            Reassign Manager
          </Button>
          <Button
            variant={agent.status === 'ACTIVE' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => onStatusChange(agent)}
          >
            <Power className="w-3.5 h-3.5 mr-1.5" />
            {agent.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3 width): Identity, Manager, Numbers & Activity */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-purple-dim)] border border-[var(--border-subtle)] text-[var(--accent-purple)] flex items-center justify-center font-bold text-lg shadow-[0_0_20px_var(--accent-purple-dim)]">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[var(--text-primary)] truncate">{agent.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{agent.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Agent ID</span>
                <span className="font-mono text-[var(--text-primary)]">{agent.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Hierarchy Tier</span>
                <Badge variant="purple" size="sm">AGENT</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Organization</span>
                <span className="text-[var(--text-primary)]">{agent.organization}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Created Date</span>
                <span className="text-[var(--text-primary)] font-mono">{formatDate(agent.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Last Activity</span>
                <span className="text-[var(--text-primary)] font-mono">
                  {agent.lastLoginAt ? formatRelativeTime(agent.lastLoginAt) : 'Never logged in'}
                </span>
              </div>
            </div>
          </Card>

          {/* Supervising Manager Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[var(--accent-blue)]" />
                <span>Supervising Manager</span>
              </h3>
              <Button variant="outline" size="sm" onClick={() => onAssignManager(agent)}>
                Reassign
              </Button>
            </div>

            {agent.manager ? (
              <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-[var(--text-primary)]">{agent.manager.name}</div>
                  <Badge variant="info" size="sm">{agent.manager.department}</Badge>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">{agent.manager.email}</div>
                <div className="text-[10px] text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
                  Supervising team capacity: {agent.manager.assignedAgentsCount} of {agent.manager.maxAgents} agents
                </div>
              </div>
            ) : (
              <div className="p-4 text-center bg-[var(--bg-glass-card)] border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-muted)]">
                No manager assigned. Agent is in the direct unassigned pool.
              </div>
            )}
          </Card>

          {/* Number Allocation Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Hash className="w-4 h-4 text-[var(--accent-amber)]" />
                <span>Number Allocation</span>
              </h3>
              <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                {agent.assignedNumbersCount} E.164
              </span>
            </div>

            <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2">
              <div className="text-xs text-[var(--text-secondary)]">Assigned E.164 Numbers:</div>
              {agent.numbers && agent.numbers.length > 0 ? (
                <div className="space-y-1.5">
                  {agent.numbers.slice(0, 3).map((num) => (
                    <div key={num.id} className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-[var(--text-primary)]">{num.e164Number}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{num.operator}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[var(--text-muted)]">No specific numbers assigned yet.</div>
              )}
            </div>
          </Card>

          {/* Recent Activity Card */}
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-emerald)]" />
              <span>Recent Activity</span>
            </h3>

            <div className="space-y-2.5">
              {agent.recentActivity && agent.recentActivity.length > 0 ? (
                agent.recentActivity.map((act) => (
                  <div key={act.id} className="text-xs space-y-0.5 border-l-2 border-[var(--accent-purple)] pl-2.5 py-0.5">
                    <div className="font-semibold text-[var(--text-primary)]">{act.action}</div>
                    <div className="text-[var(--text-muted)]">{act.description}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {formatRelativeTime(act.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[var(--text-muted)]">No recent events logged.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (2/3 width): Commission & Client Portfolio & Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Commission & Earnings Card */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[var(--accent-emerald)]" />
                  <span>Commission & Financial Clearing</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Platform volume earnings for commercial SMS clients. Current rate:{' '}
                  <strong className="text-[var(--text-primary)]">{formatPercent(agent.commissionRate)}</strong>
                </p>
              </div>
              <Badge variant="success" size="md">
                {agent.commission?.currentPeriod || 'Active Period'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
                <div className="text-xs text-[var(--text-muted)] font-medium">Total Lifetime Earned</div>
                <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                  {formatCurrency(agent.commission?.earned || agent.earnings)}
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
                <div className="text-xs text-[var(--text-muted)] font-medium">Pending Clearing</div>
                <div className="text-xl font-bold font-mono text-[var(--accent-amber)] mt-1">
                  {formatCurrency(agent.commission?.pending || 0)}
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
                <div className="text-xs text-[var(--text-muted)] font-medium">Paid to Date</div>
                <div className="text-xl font-bold font-mono text-[var(--accent-emerald)] mt-1">
                  {formatCurrency(agent.commission?.paid || agent.earnings)}
                </div>
              </div>
            </div>

            {/* Historical Monthly Trend */}
            {agent.commission?.historical && agent.commission.historical.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  <span>Recent Monthly Clearing Trend:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {agent.commission.historical.map((m) => (
                    <div
                      key={m.month}
                      className="p-2.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl text-center"
                    >
                      <div className="text-[10px] text-[var(--text-muted)] font-medium">{m.month}</div>
                      <div className="text-xs font-bold font-mono text-[var(--text-primary)] mt-0.5">
                        {formatCurrency(m.amount)}
                      </div>
                      <div className="text-[9px] text-[var(--text-secondary)] font-mono mt-0.5">
                        {m.messageCount.toLocaleString()} SMS
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Client Portfolio Card */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[var(--accent-blue)]" />
                  <span>Client Portfolio ({agent.clientsCount} Accounts)</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {activeClients} Active accounts • {suspendedClients} Suspended
                </p>
              </div>

              <Button variant="secondary" size="sm" onClick={() => onViewClients(agent)}>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Full Portfolio
              </Button>
            </div>

            {agent.clients && agent.clients.length > 0 ? (
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-glass-card)] text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-4 py-3">Client Account</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Billing</th>
                      <th className="px-4 py-3">Numbers</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {agent.clients.map((client) => (
                      <tr key={client.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--text-primary)]">{client.companyName}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{client.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={client.status === 'ACTIVE' ? 'success' : 'error'} size="sm">
                            {client.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">{client.billingType}</span>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {client.assignedNumbersCount} E.164
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          {formatCurrency(client.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-muted)]">
                No clients currently assigned to this agent portfolio.
              </div>
            )}
          </Card>

          {/* Effective Permissions Card */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-purple)]" />
                <span>Effective RBAC Permissions</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Inherited through the canonical <strong>AGENT</strong> tier. Scoped strictly to assigned client portfolios.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AGENT_PERMISSION_GROUPS.map((group) => (
                <div
                  key={group.module}
                  className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2"
                >
                  <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    {group.module}
                  </div>
                  <div className="space-y-1.5">
                    {group.permissions.map((perm) => (
                      <div key={perm.code} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-purple)] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)]">{perm.label}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">{perm.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
