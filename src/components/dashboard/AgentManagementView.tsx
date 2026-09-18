/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAgents } from '../../hooks/useAgents';
import {
  AgentItem,
  AgentDetail,
  AgentStatus,
  AgentsSortField,
  CreateAgentPayload,
  UpdateAgentPayload,
} from '../../types/agents';
import { StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar } from '../ui/FilterBar';
import { Table, ColumnDef } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { StatCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { NotFoundState } from '../system/NotFoundState';
import { PageHeader } from '../ui/PageHeader';
import { MoreActionsMenu } from '../ui/MoreActionsMenu';

import { CreateAgentModal } from './agents/CreateAgentModal';
import { EditAgentModal } from './agents/EditAgentModal';
import { AgentStatusModal } from './agents/AgentStatusModal';
import { AssignManagerModal } from './agents/AssignManagerModal';
import { AgentClientsModal } from './agents/AgentClientsModal';
import { AgentDetailsView } from './agents/AgentDetailsView';

import { formatDate, formatNumber, formatCurrency, formatRelativeTime } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  ShieldAlert,
  Briefcase,
  Hash,
  DollarSign,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Power,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const AgentManagementView: React.FC = () => {
  const {
    agents,
    totalCount,
    kpis,
    managers,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    error,
    selectedAgentId,
    selectedAgentDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectAgent,
    clearSelectedAgent,
    createAgent,
    updateAgent,
    updateAgentStatus,
    assignManager,
    refresh,
  } = useAgents();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentItem | null>(null);
  const [assigningManagerTarget, setAssigningManagerTarget] = useState<AgentItem | null>(null);
  const [viewingClientsTarget, setViewingClientsTarget] = useState<AgentDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    agent: AgentItem | null;
    nextStatus: AgentStatus | null;
  }>({
    agent: null,
    nextStatus: null,
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

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

  const handleOpenStatusModal = (agent: AgentItem) => {
    const nextStatus: AgentStatus = agent.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusTarget({
      agent,
      nextStatus,
    });
  };

  const handleCreateSubmit = async (payload: CreateAgentPayload) => {
    try {
      await createAgent(payload);
      showToast(`Agent "${payload.name}" created successfully`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create agent', 'error');
      throw err;
    }
  };

  const handleEditSubmit = async (id: string, payload: UpdateAgentPayload) => {
    try {
      await updateAgent(id, payload);
      showToast('Agent profile updated successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update agent', 'error');
      throw err;
    }
  };

  const handleStatusConfirm = async (id: string, newStatus: AgentStatus, reason?: string) => {
    try {
      await updateAgentStatus(id, newStatus, reason);
      showToast(`Agent status changed to ${newStatus}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to change agent status', 'error');
      throw err;
    }
  };

  const handleAssignManagerConfirm = async (agentId: string, managerId: string | null) => {
    try {
      await assignManager(agentId, managerId);
      showToast('Supervising manager updated successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to assign manager', 'error');
      throw err;
    }
  };

  // If viewing details for /agents/:id
  if (selectedAgentId) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Management', onClick: clearSelectedAgent },
              { label: 'Agents', onClick: clearSelectedAgent },
              { label: 'Loading...' },
            ]}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
        </div>
      );
    }

    if (selectedAgentDetail) {
      return (
        <>
          <AgentDetailsView
            agent={selectedAgentDetail}
            onBack={clearSelectedAgent}
            onEdit={(a) => setEditingAgent(a)}
            onStatusChange={(a) => handleOpenStatusModal(a)}
            onAssignManager={(a) => setAssigningManagerTarget(a)}
            onViewClients={(a) => setViewingClientsTarget(a)}
          />

          {/* Edit Modal */}
          <EditAgentModal
            isOpen={!!editingAgent}
            onClose={() => setEditingAgent(null)}
            agent={editingAgent}
            onSubmit={handleEditSubmit}
            managers={managers}
          />

          {/* Status Modal */}
          <AgentStatusModal
            isOpen={!!statusTarget.agent}
            onClose={() => setStatusTarget({ agent: null, nextStatus: null })}
            agent={statusTarget.agent}
            targetStatus={statusTarget.nextStatus}
            onConfirm={handleStatusConfirm}
          />

          {/* Assign Manager Modal */}
          <AssignManagerModal
            isOpen={!!assigningManagerTarget}
            onClose={() => setAssigningManagerTarget(null)}
            agent={assigningManagerTarget}
            managers={managers}
            onConfirm={handleAssignManagerConfirm}
          />

          {/* Client Portfolio Modal */}
          <AgentClientsModal
            isOpen={!!viewingClientsTarget}
            onClose={() => setViewingClientsTarget(null)}
            agent={viewingClientsTarget}
            clients={selectedAgentDetail.clients || []}
          />
        </>
      );
    }

    // Invalid / missing agent ID route (e.g. /agents/invalid)
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Management', onClick: clearSelectedAgent },
            { label: 'Agents', onClick: clearSelectedAgent },
            { label: 'Not Found' },
          ]}
        />
        <NotFoundState
          title="Agent Account Not Found"
          resourceName="Agent Profile"
          resourceId={selectedAgentId}
          onBack={clearSelectedAgent}
        />
      </div>
    );
  }

  // Table Columns Definition
  const columns: ColumnDef<AgentItem>[] = [
    {
      key: 'name',
      header: 'Agent',
      render: (agent) => {
        const initials = agent.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('');

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-purple-dim)] border border-[var(--border-subtle)] text-[var(--accent-purple)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  selectAgent(agent.id);
                }}
                className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-purple)] transition-colors cursor-pointer truncate"
              >
                {agent.name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                {agent.email}
              </div>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      render: (agent) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {agent.email}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'manager',
      header: 'Supervising Manager',
      render: (agent) =>
        agent.managerName ? (
          <div>
            <div className="text-xs font-medium text-[var(--text-primary)]">{agent.managerName}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{agent.department || 'Operations'}</div>
          </div>
        ) : (
          <Badge variant="neutral" size="sm">Unassigned</Badge>
        ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (agent) => (
        <Badge variant={getStatusBadgeVariant(agent.status)} size="sm">
          {agent.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'clients',
      header: 'Clients',
      render: (agent) => (
        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
          {agent.clientsCount} accounts
        </span>
      ),
      sortable: true,
    },
    {
      key: 'numbers',
      header: 'Assigned Numbers',
      render: (agent) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {agent.assignedNumbersCount} E.164
        </span>
      ),
      sortable: true,
    },
    {
      key: 'earnings',
      header: 'Commission / Earnings',
      render: (agent) => (
        <span className="font-mono text-xs font-bold text-[var(--accent-emerald)]">
          {formatCurrency(agent.earnings)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: (agent) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {agent.lastLoginAt ? formatRelativeTime(agent.lastLoginAt) : 'Never'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (agent) => (
        <div className="flex items-center justify-end">
          <MoreActionsMenu
            ariaLabel={`Actions for ${agent.name}`}
            items={[
              {
                id: 'view',
                label: 'View Agent Profile',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: () => selectAgent(agent.id),
              },
              {
                id: 'edit',
                label: 'Edit Agent',
                icon: <Edit2 className="w-3.5 h-3.5" />,
                onClick: () => setEditingAgent(agent),
              },
              {
                id: 'manager',
                label: 'Reassign Manager',
                icon: <UserCheck className="w-3.5 h-3.5" />,
                onClick: () => setAssigningManagerTarget(agent),
              },
              {
                id: 'status',
                label: agent.status === 'ACTIVE' ? 'Suspend Agent' : 'Activate Agent',
                icon: <Power className="w-3.5 h-3.5" />,
                isDangerous: agent.status === 'ACTIVE',
                confirmTitle: `Suspend Agent ${agent.name}`,
                confirmMessage: `Are you sure you want to suspend agent ${agent.name}? Their managed clients and commission clearing will be temporarily put on hold.`,
                onClick: () => handleOpenStatusModal(agent),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-[var(--accent-emerald-dim)] border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)]'
              : 'bg-[var(--accent-rose-dim)] border-[var(--accent-rose)]/30 text-[var(--accent-rose)]'
          }`}
          role="status"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Standard Page Header Pattern */}
      <PageHeader
        title="Agents"
        description="Commercial agent directory, client portfolio oversight, and commission clearing."
        breadcrumbs={[{ label: 'Management' }, { label: 'Agents' }]}
        primaryAction={{
          label: 'Create Agent',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-3.5 h-3.5" />,
          id: 'btn-create-agent',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh Agents telemetry"
          >
            Refresh
          </Button>
        }
      />

      {/* KPI Summary (4 StatCards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Agents"
              value={formatNumber(kpis.totalAgents)}
              subtext="Commercial field representatives"
              icon={Users}
              iconBgColor="bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]"
              badgeText="Hierarchy"
              badgeVariant="purple"
            />
            <StatCard
              title="Active Agents"
              value={formatNumber(kpis.activeAgents)}
              subtext="Generating volume traffic"
              icon={UserCheck}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Operational"
              badgeVariant="success"
            />
            <StatCard
              title="Suspended Agents"
              value={formatNumber(kpis.suspendedAgents)}
              subtext="Held credentials or compliance"
              icon={ShieldAlert}
              iconBgColor="bg-[var(--accent-rose-dim)] text-[var(--accent-rose)]"
              badgeText={kpis.suspendedAgents > 0 ? 'Review' : 'Zero'}
              badgeVariant={kpis.suspendedAgents > 0 ? 'error' : 'neutral'}
            />
            <StatCard
              title="Total Clients Managed"
              value={formatNumber(kpis.totalClientsManaged)}
              subtext={`Avg. ${kpis.averageClientsPerAgent} clients/agent • ${formatCurrency(kpis.totalCommissionEarned)} commission`}
              icon={Briefcase}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="Portfolio"
              badgeVariant="info"
            />
          </>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search by agent name, email, or manager..."
        searchValue={filterState.search}
        onSearchChange={(val) => updateFilter('search', val)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: filterState.status,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Disabled', value: 'DISABLED' },
            ],
            onChange: (val) => updateFilter('status', val),
          },
          {
            key: 'managerId',
            label: 'Manager',
            value: filterState.managerId,
            options: [
              { label: 'All Managers', value: 'ALL' },
              { label: 'Unassigned (Direct)', value: 'UNASSIGNED' },
              ...managers.map((m) => ({ label: `${m.name} (${m.department})`, value: m.id })),
            ],
            onChange: (val) => updateFilter('managerId', val),
          },
          {
            key: 'clientCountRange',
            label: 'Client Portfolio',
            value: filterState.clientCountRange,
            options: [
              { label: 'All Ranges', value: 'ALL' },
              { label: '0 Clients (Empty)', value: '0' },
              { label: '1 - 10 Clients', value: '1-10' },
              { label: '11 - 20 Clients', value: '11-20' },
              { label: '20+ Clients (Enterprise)', value: '20+' },
            ],
            onChange: (val) => updateFilter('clientCountRange', val),
          },
          {
            key: 'sortBy',
            label: 'Sort By',
            value: filterState.sortBy,
            options: [
              { label: 'Date Created', value: 'createdAt' },
              { label: 'Name', value: 'name' },
              { label: 'Clients Count', value: 'clients' },
              { label: 'Assigned Numbers', value: 'numbers' },
              { label: 'Earnings / Commission', value: 'earnings' },
              { label: 'Last Activity', value: 'lastActivity' },
            ],
            onChange: (val) => updateFilter('sortBy', val as AgentsSortField),
          },
        ]}
        onReset={resetFilters}
      />

      {/* Main Table / State View */}
      {error ? (
        <ErrorState
          title="Failed to Load Agents"
          message={error}
          onRetry={refresh}
        />
      ) : agents.length === 0 && !isLoading ? (
        <EmptyState
          title="No agents found"
          message="No commercial agent profiles match your active search and filter criteria."
          icon={Users}
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={agents}
            keyExtractor={(a) => a.id}
            isLoading={isLoading}
            onRowClick={(a) => selectAgent(a.id)}
            emptyMessage="No agents available"
          />

          {/* Pagination */}
          {totalCount > filterState.limit && (
            <Pagination
              currentPage={filterState.page}
              totalPages={totalPages}
              onPageChange={(page) => updateFilter('page', page)}
              pageSize={filterState.limit}
              totalItems={totalCount}
            />
          )}
        </div>
      )}

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        managers={managers}
      />

      {/* Edit Agent Modal */}
      <EditAgentModal
        isOpen={!!editingAgent}
        onClose={() => setEditingAgent(null)}
        agent={editingAgent}
        onSubmit={handleEditSubmit}
        managers={managers}
      />

      {/* Status Modal */}
      <AgentStatusModal
        isOpen={!!statusTarget.agent}
        onClose={() => setStatusTarget({ agent: null, nextStatus: null })}
        agent={statusTarget.agent}
        targetStatus={statusTarget.nextStatus}
        onConfirm={handleStatusConfirm}
      />

      {/* Assign Manager Modal */}
      <AssignManagerModal
        isOpen={!!assigningManagerTarget}
        onClose={() => setAssigningManagerTarget(null)}
        agent={assigningManagerTarget}
        managers={managers}
        onConfirm={handleAssignManagerConfirm}
      />
    </div>
  );
};
