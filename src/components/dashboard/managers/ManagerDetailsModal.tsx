import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { ManagerDetail } from '../../../types/manager';
import { Badge } from '../../ui/Badge';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Shield,
  Users,
  Briefcase,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Hash,
} from 'lucide-react';

interface ManagerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerDetail | null;
  isLoading: boolean;
}

export const ManagerDetailsModal: React.FC<ManagerDetailsModalProps> = ({
  isOpen,
  onClose,
  manager,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'clients' | 'permissions' | 'audit'>(
    'overview'
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={manager ? `${manager.name}` : 'Manager Profile'}
      subtitle={manager ? `@${manager.username} • ${manager.department}` : 'Loading profile data...'}
      maxWidth="3xl"
    >
      {isLoading || !manager ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[var(--text-secondary)]">Loading comprehensive manager profile and hierarchy...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                <span>Agents</span>
              </div>
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {manager.activitySummary.totalAgents}
                <span className="text-[11px] font-normal text-[var(--text-tertiary)] ml-1">/ {manager.maxAgents} max</span>
              </div>
            </div>

            <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <Briefcase className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                <span>Clients</span>
              </div>
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {manager.activitySummary.totalClients}
              </div>
            </div>

            <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                <span>Total Logins</span>
              </div>
              <div className="text-lg font-bold text-[var(--text-primary)]">
                {manager.activitySummary.totalLogins}
              </div>
            </div>

            <div className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Last Active</span>
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {manager.lastLoginAt ? new Date(manager.lastLoginAt).toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--glass-border)] gap-6 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-[var(--accent-blue)] font-semibold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile Overview
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'agents'
                  ? 'border-blue-600 text-[var(--accent-blue)] font-semibold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Assigned Agents ({manager.agents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'clients'
                  ? 'border-blue-600 text-[var(--accent-blue)] font-semibold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Clients Portfolio ({manager.clients?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'border-blue-600 text-[var(--accent-blue)] font-semibold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Permissions ({manager.permissions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-[var(--accent-blue)] font-semibold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Activity Log ({manager.recentActivity?.length || 0})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Personal & Account Info
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Full Name:</span>
                      <span className="font-medium text-[var(--text-primary)]">{manager.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Username:</span>
                      <span className="font-mono text-[var(--text-primary)]">@{manager.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Corporate Email:</span>
                      <span className="font-mono text-[var(--text-primary)]">{manager.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Contact Phone:</span>
                      <span className="text-[var(--text-primary)]">{manager.contact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Department:</span>
                      <span className="text-[var(--text-primary)] font-medium">{manager.department}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Status & Telemetry
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Account Status:</span>
                      <Badge
                        variant={
                          manager.status === 'ACTIVE'
                            ? 'success'
                            : manager.status === 'SUSPENDED'
                            ? 'error'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {manager.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Created Date:</span>
                      <span className="text-[var(--text-primary)] font-mono text-[11px]">
                        {new Date(manager.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Last Login:</span>
                      <span className="text-[var(--text-primary)] font-mono text-[11px]">
                        {manager.lastLoginAt ? new Date(manager.lastLoginAt).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Agent Capacity:</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {manager.agentsCount} / {manager.maxAgents} allocated
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Client Portfolio:</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {manager.clientsCount} connected clients
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGENTS */}
          {activeTab === 'agents' && (
            <div className="space-y-3">
              {!manager.agents || manager.agents.length === 0 ? (
                <div className="p-8 text-center bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[var(--text-secondary)] text-xs">
                  No agents currently assigned to this manager.
                </div>
              ) : (
                <div className="border border-[var(--glass-border)] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--glass-bg)] text-[var(--text-secondary)] font-medium border-b border-[var(--glass-border)]">
                      <tr>
                        <th className="px-4 py-2.5">Agent Name</th>
                        <th className="px-4 py-2.5">Contact</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Commission</th>
                        <th className="px-4 py-2.5 text-right">Clients</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)] divide-[var(--glass-border)]">
                      {manager.agents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-[var(--glass-bg)]/50 hover:bg-[var(--bg-surface)]/50">
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-[var(--text-primary)]">{agent.name}</div>
                            <div className="text-[11px] font-mono text-[var(--text-secondary)]">{agent.email}</div>
                          </td>
                          <td className="px-4 py-2.5 text-[var(--text-secondary)]">{agent.contact}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                              {agent.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[var(--text-secondary)]">
                            {agent.commissionRate}%
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                            {agent.clientsCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLIENTS */}
          {activeTab === 'clients' && (
            <div className="space-y-3">
              {!manager.clients || manager.clients.length === 0 ? (
                <div className="p-8 text-center bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[var(--text-secondary)] text-xs">
                  No clients currently assigned under this manager's agency branch.
                </div>
              ) : (
                <div className="border border-[var(--glass-border)] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--glass-bg)] text-[var(--text-secondary)] font-medium border-b border-[var(--glass-border)]">
                      <tr>
                        <th className="px-4 py-2.5">Client / Company</th>
                        <th className="px-4 py-2.5">Billing</th>
                        <th className="px-4 py-2.5">Numbers</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)] divide-[var(--glass-border)]">
                      {manager.clients.map((client) => (
                        <tr key={client.id} className="hover:bg-[var(--glass-bg)]/50 hover:bg-[var(--bg-surface)]/50">
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-[var(--text-primary)]">{client.companyName}</div>
                            <div className="text-[11px] text-[var(--text-secondary)]">
                              {client.name} • {client.email}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="info" size="sm">
                              {client.billingType}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[var(--text-secondary)]">
                            {client.assignedNumbersCount} numbers
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                              {client.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-[var(--accent-emerald)]">
                            ${client.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="text-xs text-[var(--text-secondary)] mb-2">
                The following {manager.permissions.length} granular capabilities are explicitly assigned to this manager account:
              </div>
              <div className="flex flex-wrap gap-2">
                {manager.permissions.map((perm) => (
                  <Badge key={perm} variant="purple" size="md">
                    <CheckCircle2 className="w-3 h-3 text-[var(--accent-violet)] mr-1" />
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              {!manager.recentActivity || manager.recentActivity.length === 0 ? (
                <div className="p-8 text-center bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[var(--text-secondary)] text-xs">
                  No activity events recorded for this manager yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {manager.recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral" size="sm">
                            {log.action}
                          </Badge>
                          <span className="font-mono text-[11px] text-[var(--text-secondary)]">{log.email}</span>
                        </div>
                        {log.reason && (
                          <div className="text-[var(--text-secondary)] font-medium">
                            {log.reason}
                          </div>
                        )}
                        {log.ipAddress && (
                          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                            IP: {log.ipAddress} • {log.userAgent}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-3 border-t border-[var(--glass-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[var(--glass-bg-active)] text-[var(--text-secondary)] rounded-lg text-xs font-semibold hover:bg-[var(--glass-bg-hover)] hover:bg-[var(--glass-bg-hover)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
