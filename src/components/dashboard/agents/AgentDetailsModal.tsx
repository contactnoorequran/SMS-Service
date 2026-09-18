import React, { useState } from 'react';
import { AgentDetail } from '../../../types/agent';
import { Modal } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';
import {
  Users,
  Hash,
  MessageSquare,
  DollarSign,
  Wallet,
  Shield,
  Clock,
  Building,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Activity,
  Percent,
} from 'lucide-react';

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentDetail | null;
  isLoading: boolean;
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({
  isOpen,
  onClose,
  agent,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'numbers' | 'activity'>('overview');

  if (!agent && !isLoading) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">SUSPENDED</Badge>;
      case 'INACTIVE':
      default:
        return <Badge variant="neutral">INACTIVE</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? `${agent.name} — Operational Agent Dossier` : 'Agent Dossier'}
      subtitle={agent ? `${agent.username} • ${agent.email}` : 'Loading details...'}
      maxWidth="xl"
    >
      {isLoading || !agent ? (
        <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          Fetching agent profile, assigned clients, and number inventory...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--glass-border)] gap-1 pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Overview & Statistics
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'clients'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Assigned Clients ({agent.clients?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('numbers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'numbers'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              Number Inventory ({agent.numbers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'activity'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Activity Trail ({agent.recentActivity?.length || 0})
            </button>
          </div>

          {/* TAB 1: Overview & Statistics */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Agent KPI Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 bg-[var(--glass-bg)]/60 rounded-xl border border-[var(--glass-border)]">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Total Clients</div>
                  <div className="text-base font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1">
                    <Users className="w-4 h-4 text-[var(--accent-blue)]" />
                    {agent.statistics.totalClients}
                  </div>
                </div>

                <div className="p-3 bg-[var(--glass-bg)]/60 rounded-xl border border-[var(--glass-border)]">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Assigned Numbers</div>
                  <div className="text-base font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1">
                    <Hash className="w-4 h-4 text-[var(--accent-emerald)]" />
                    {agent.statistics.assignedNumbers}
                  </div>
                </div>

                <div className="p-3 bg-[var(--glass-bg)]/60 rounded-xl border border-[var(--glass-border)]">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Unassigned Numbers</div>
                  <div className="text-base font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1">
                    <Hash className="w-4 h-4 text-[var(--accent-amber)]" />
                    {agent.statistics.unassignedNumbers}
                  </div>
                </div>

                <div className="p-3 bg-[var(--glass-bg)]/60 rounded-xl border border-[var(--glass-border)]">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">SMS Count</div>
                  <div className="text-base font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    {agent.statistics.smsCount.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-[var(--glass-bg)]/60 rounded-xl border border-[var(--glass-border)]">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Earnings</div>
                  <div className="text-base font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-[var(--accent-emerald)]" />
                    ${agent.statistics.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 bg-[var(--glass-bg)]/60 rounded-xl border border-[var(--glass-border)]">
                  <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Current Balance</div>
                  <div className="text-base font-bold text-[var(--text-primary)] mt-1 flex items-center gap-1">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    ${agent.statistics.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Profile Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <UserCheck className="w-4 h-4 text-[var(--accent-blue)]" />
                    Agent Identity & Hierarchy
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">Agent Profile ID:</span>
                      <span className="font-mono font-medium">{agent.id}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">User Account ID:</span>
                      <span className="font-mono font-medium">{agent.userId}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">Supervisory Manager:</span>
                      <span className="font-semibold text-[var(--accent-blue)]">
                        {agent.manager ? `${agent.manager.name} (${agent.manager.department || 'Operations'})` : 'Direct Super Admin'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">Commission Rate:</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {(agent.commissionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">Account Status:</span>
                      <span>{getStatusBadge(agent.status)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[var(--text-secondary)]">Contact Telephone:</span>
                      <span className="font-medium">{agent.contact || 'None registered'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Shield className="w-4 h-4 text-[var(--accent-emerald)]" />
                    Security & Timestamps
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">Created Timestamp:</span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {new Date(agent.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">Last Modified:</span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {new Date(agent.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--glass-border)]">
                      <span className="text-[var(--text-secondary)]">Last Successful Login:</span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {agent.lastLoginAt ? new Date(agent.lastLoginAt).toLocaleString() : 'Never logged in'}
                      </span>
                    </div>
                    <div className="py-1">
                      <span className="text-[var(--text-secondary)] block mb-1.5">Assigned Security Grants ({agent.permissions.length}):</span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {agent.permissions.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] rounded text-[10px] font-mono border border-[rgba(59,130,246,0.2)]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Assigned Clients */}
          {activeTab === 'clients' && (
            <div className="space-y-3">
              {agent.clients.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-tertiary)] border border-dashed border-[var(--glass-border)] rounded-xl">
                  No clients currently assigned to this agent portfolio.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[var(--glass-border)] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--glass-bg)]/60 border-b border-[var(--glass-border)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5">Client & Company</th>
                        <th className="px-3 py-2.5">Contact Details</th>
                        <th className="px-3 py-2.5">Billing</th>
                        <th className="px-3 py-2.5 text-center">Numbers</th>
                        <th className="px-3 py-2.5 text-right">Balance</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {agent.clients.map((cli) => (
                        <tr key={cli.id} className="hover:bg-[var(--glass-bg)]/50 /30">
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-[var(--text-primary)]">{cli.name}</div>
                            <div className="text-[11px] text-[var(--text-secondary)]">{cli.companyName}</div>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] font-mono text-[11px]">
                            <div>{cli.email}</div>
                            <div>{cli.contact}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 bg-[var(--glass-bg-active)] text-[var(--text-secondary)] rounded text-[10px] font-mono">
                              {cli.billingType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-[var(--text-primary)]">
                            {cli.assignedNumbersCount}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold text-[var(--accent-emerald)]">
                            ${cli.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2.5 text-center">{getStatusBadge(cli.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Number Inventory */}
          {activeTab === 'numbers' && (
            <div className="space-y-3">
              {agent.numbers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-tertiary)] border border-dashed border-[var(--glass-border)] rounded-xl">
                  No numbers allocated to this agent.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[var(--glass-border)] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--glass-bg)]/60 border-b border-[var(--glass-border)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5">E.164 Number</th>
                        <th className="px-3 py-2.5">Country & Operator</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5">Client Assigned</th>
                        <th className="px-3 py-2.5">Capabilities</th>
                        <th className="px-3 py-2.5">Assigned Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {agent.numbers.map((num) => (
                        <tr key={num.id} className="hover:bg-[var(--glass-bg)]/50 /30">
                          <td className="px-3 py-2.5 font-mono font-bold text-[var(--text-primary)]">
                            {num.e164Number}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="text-[var(--text-primary)]">{num.country} ({num.countryCode})</div>
                            <div className="text-[11px] text-[var(--text-secondary)]">{num.operator}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                num.status === 'ASSIGNED'
                                  ? 'bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] border border-[rgba(16,185,129,0.25)]'
                                  : 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[rgba(245,158,11,0.25)]'
                              }`}
                            >
                              {num.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                            {num.clientName || <span className="text-[var(--text-tertiary)] italic">Unassigned pool</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-[10px] bg-[var(--glass-bg-active)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">
                              {num.capabilities}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] text-[11px]">
                            {num.assignedAt ? new Date(num.assignedAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Activity Trail */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {agent.recentActivity.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-tertiary)] border border-dashed border-[var(--glass-border)] rounded-xl">
                  No activity log entries recorded for this agent account.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {agent.recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[var(--glass-bg)]/50 rounded-xl border border-[var(--glass-border)] flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[var(--accent-blue)]">
                            {log.action}
                          </span>
                          <span className="text-[var(--text-tertiary)] text-[10px]">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)] mt-1 leading-snug">
                          {log.reason || 'Operational action logged'}
                        </p>
                      </div>
                      {log.ipAddress && (
                        <span className="font-mono text-[10px] text-[var(--text-tertiary)] shrink-0">
                          {log.ipAddress}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-[var(--glass-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[var(--glass-bg-active)] hover:bg-[var(--glass-bg-hover)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] text-xs font-semibold rounded-xl transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
