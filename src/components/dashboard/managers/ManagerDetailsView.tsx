/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CapacityIndicator } from './CapacityIndicator';
import { ManagerDetail, ManagerStatus } from '../../../types/managers';
import { formatDate, formatRelativeTime } from '../../../utils/formatters';
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
  UserPlus,
  ExternalLink,
  CheckCircle2,
  Lock,
  Activity,
} from 'lucide-react';

interface ManagerDetailsViewProps {
  manager: ManagerDetail;
  onBack: () => void;
  onEdit: (manager: ManagerDetail) => void;
  onStatusChange: (manager: ManagerDetail) => void;
  onManageAgents: (manager: ManagerDetail) => void;
}

// Reusable permission groups matching the Users/RBAC taxonomy
const PERMISSION_GROUPS = [
  {
    module: 'Management',
    permissions: [
      { code: 'users.read', label: 'View Users & Agents', desc: 'Read-only directory inspection' },
      { code: 'users.update', label: 'Update Team Profiles', desc: 'Modify assigned agent settings' },
    ],
  },
  {
    module: 'Telecom Operations',
    permissions: [
      { code: 'numbers.read', label: 'View Range Inventory', desc: 'Inspect available DID pools' },
      { code: 'numbers.assign', label: 'Assign Phone Numbers', desc: 'Allocate numbers to clients' },
    ],
  },
  {
    module: 'Carrier Routing',
    permissions: [
      { code: 'providers.read', label: 'View Carrier Status', desc: 'Check carrier availability & health' },
    ],
  },
  {
    module: 'Messaging & CDR',
    permissions: [
      { code: 'messages.read', label: 'Read Inbound Stream', desc: 'Inspect incoming traffic logs' },
      { code: 'cdr.read', label: 'Access Call Records', desc: 'Download Call Detail Records' },
    ],
  },
  {
    module: 'Financial Clearing',
    permissions: [
      { code: 'rates.read', label: 'View Client Rate Cards', desc: 'Inspect wholesale & retail pricing' },
      { code: 'wallet.read', label: 'Inspect Balances', desc: 'Review team wallet clearing' },
    ],
  },
  {
    module: 'Analytics & Reporting',
    permissions: [
      { code: 'dashboard.read', label: 'Access Operations Hub', desc: 'View operational KPIs' },
      { code: 'reports.generate', label: 'Generate Exports', desc: 'Export summary telemetry' },
    ],
  },
];

export const ManagerDetailsView: React.FC<ManagerDetailsViewProps> = ({
  manager,
  onBack,
  onEdit,
  onStatusChange,
  onManageAgents,
}) => {
  const getStatusBadgeVariant = (status: ManagerStatus) => {
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

  const initials = (manager?.name || 'Manager')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Management', onClick: onBack },
              { label: 'Managers', onClick: onBack },
              { label: manager.name },
            ]}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Back to Managers directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              {manager.name}
            </h1>
            <Badge variant={getStatusBadgeVariant(manager.status)} size="md">
              {manager.status}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(manager)}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onManageAgents(manager)}>
            <Users className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-blue)]" />
            Manage Agents
          </Button>
          <Button
            variant={manager.status === 'ACTIVE' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => onStatusChange(manager)}
          >
            <Power className="w-3.5 h-3.5 mr-1.5" />
            {manager.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Two-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3 width): Identity & Capacity */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-lg shadow-[0_0_20px_var(--accent-blue-dim)]">
                {initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">{manager.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{manager.email}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  Department
                </span>
                <span className="font-semibold text-[var(--text-primary)]">{manager.department}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                  Hierarchy Tier
                </span>
                <Badge variant="success" size="sm">
                  MANAGER
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  Created At
                </span>
                <span className="text-[var(--text-primary)] font-mono">{formatDate(manager.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  Last Activity
                </span>
                <span className="text-[var(--text-primary)] font-mono">
                  {manager.lastLoginAt ? formatRelativeTime(manager.lastLoginAt) : 'Never logged in'}
                </span>
              </div>
            </div>
          </Card>

          {/* Capacity Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--accent-blue)]" />
                <span>Agent Capacity Quota</span>
              </h3>
              <Badge
                variant={
                  manager.capacityStatus === 'FULL'
                    ? 'error'
                    : manager.capacityStatus === 'NEAR_CAPACITY'
                    ? 'warning'
                    : 'info'
                }
                size="sm"
              >
                {manager.capacityStatus.replace('_', ' ')}
              </Badge>
            </div>

            <CapacityIndicator
              current={manager.assignedAgentsCount}
              max={manager.maxAgents}
              size="md"
              showLabels={true}
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
                <div className="text-[11px] text-[var(--text-muted)]">Maximum Allowed</div>
                <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
                  {manager.maxAgents}
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
                <div className="text-[11px] text-[var(--text-muted)]">Available Slots</div>
                <div className="text-lg font-bold text-[var(--accent-emerald)] font-mono mt-0.5">
                  {manager.availableSlots}
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Operational Audit Stream */}
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-purple)]" />
              <span>Recent Activity</span>
            </h3>

            <div className="space-y-2.5">
              {manager.recentActivity && manager.recentActivity.length > 0 ? (
                manager.recentActivity.map((act) => (
                  <div key={act.id} className="text-xs space-y-0.5 border-l-2 border-[var(--accent-blue)] pl-2.5 py-0.5">
                    <div className="font-semibold text-[var(--text-primary)]">{act.action}</div>
                    <div className="text-[var(--text-muted)]">{act.description}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {formatRelativeTime(act.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[var(--text-muted)]">No recent activity logged.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (2/3 width): Assigned Agents & Permissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Agents Table Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--accent-blue)]" />
                  <span>Assigned Agents ({manager.agents?.length || 0})</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Agents reporting directly to {manager.name} for operations and approvals.
                </p>
              </div>

              <Button variant="secondary" size="sm" onClick={() => onManageAgents(manager)}>
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Assign Agent
              </Button>
            </div>

            {manager.agents && manager.agents.length > 0 ? (
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-glass-card)] text-[var(--text-muted)] uppercase tracking-wider font-semibold border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Clients</th>
                      <th className="px-4 py-3">Assigned Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {manager.agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--text-primary)]">{agent.name}</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-mono">{agent.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={agent.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                            {agent.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                          {agent.clientsCount} clients
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)] font-mono">
                          {formatDate(agent.assignedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              // Non-breaking placeholder action or navigation if agent view exists
                              alert(`Agent details for ${agent.name} are accessible in the Agents module.`);
                            }}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            aria-label={`View agent ${agent.name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-muted)]">
                No agents currently assigned. Use "Assign Agent" to allocate agents to this manager.
              </div>
            )}
          </Card>

          {/* Effective Permissions Card */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-emerald)]" />
                <span>Effective RBAC Permissions</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Inherited through the canonical <strong>MANAGER</strong> role. Atomic authorization grants are grouped by module.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PERMISSION_GROUPS.map((group) => (
                <div
                  key={group.module}
                  className="p-4 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl space-y-2.5"
                >
                  <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center justify-between">
                    <span>{group.module}</span>
                    <Badge variant="info" size="sm">
                      {group.permissions.length} Grants
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {group.permissions.map((perm) => (
                      <div key={perm.code} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--text-primary)]">
                            {perm.label}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {perm.code}
                          </div>
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
