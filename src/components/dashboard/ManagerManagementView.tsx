/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useManagers } from '../../hooks/useManagers';
import {
  ManagerItem,
  ManagerDetail,
  ManagerStatus,
  ManagersSortField,
  CreateManagerPayload,
  UpdateManagerPayload,
} from '../../types/managers';
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

import { CapacityIndicator } from './managers/CapacityIndicator';
import { CreateManagerModal } from './managers/CreateManagerModal';
import { EditManagerModal } from './managers/EditManagerModal';
import { ManagerStatusModal } from './managers/ManagerStatusModal';
import { ManageAgentsModal } from './managers/ManageAgentsModal';
import { ManagerDetailsView } from './managers/ManagerDetailsView';

import { formatDate, formatNumber } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  Gauge,
  Building,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Power,
  Shield,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  MoreHorizontal,
} from 'lucide-react';

export const ManagerManagementView: React.FC = () => {
  const {
    managers,
    totalCount,
    kpis,
    departments,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    error,
    selectedManagerId,
    selectedManagerDetail,
    isLoadingDetail,
    agentPool,
    updateFilter,
    resetFilters,
    selectManager,
    clearSelectedManager,
    createManager,
    updateManager,
    updateManagerStatus,
    assignAgent,
    unassignAgent,
    refresh,
  } = useManagers();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerItem | null>(null);
  const [managingAgentsTarget, setManagingAgentsTarget] = useState<ManagerItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    manager: ManagerItem | null;
    nextStatus: ManagerStatus | null;
  }>({
    manager: null,
    nextStatus: null,
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

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

  const handleOpenStatusModal = (manager: ManagerItem) => {
    const nextStatus: ManagerStatus = manager.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusTarget({
      manager,
      nextStatus,
    });
  };

  const handleCreateSubmit = async (payload: CreateManagerPayload) => {
    try {
      await createManager(payload);
      showToast(`Manager "${payload.name}" created successfully`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create manager', 'error');
      throw err;
    }
  };

  const handleEditSubmit = async (id: string, payload: UpdateManagerPayload) => {
    try {
      await updateManager(id, payload);
      showToast('Manager profile updated successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update manager', 'error');
      throw err;
    }
  };

  const handleStatusConfirm = async (id: string, newStatus: ManagerStatus, reason?: string) => {
    try {
      await updateManagerStatus(id, newStatus, reason);
      showToast(`Manager status changed to ${newStatus}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to change status', 'error');
      throw err;
    }
  };

  const handleAssignAgent = async (managerId: string, agentId: string) => {
    try {
      await assignAgent(managerId, agentId);
      showToast('Agent assigned to manager team');
    } catch (err: any) {
      showToast(err?.message || 'Failed to assign agent', 'error');
      throw err;
    }
  };

  const handleUnassignAgent = async (managerId: string, agentId: string) => {
    try {
      await unassignAgent(managerId, agentId);
      showToast('Agent unassigned from manager team');
    } catch (err: any) {
      showToast(err?.message || 'Failed to unassign agent', 'error');
      throw err;
    }
  };

  // If a manager is selected for detail view (/managers/:id)
  if (selectedManagerId) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Management', onClick: clearSelectedManager },
              { label: 'Managers', onClick: clearSelectedManager },
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

    if (selectedManagerDetail) {
      return (
        <>
          <ManagerDetailsView
            manager={selectedManagerDetail}
            onBack={clearSelectedManager}
            onEdit={(m) => setEditingManager(m)}
            onStatusChange={(m) => handleOpenStatusModal(m)}
            onManageAgents={(m) => setManagingAgentsTarget(m)}
          />

          {/* Edit Modal */}
          <EditManagerModal
            isOpen={!!editingManager}
            onClose={() => setEditingManager(null)}
            manager={editingManager}
            onSubmit={handleEditSubmit}
            departments={departments}
          />

          {/* Status Modal */}
          <ManagerStatusModal
            isOpen={!!statusTarget.manager}
            onClose={() => setStatusTarget({ manager: null, nextStatus: null })}
            manager={statusTarget.manager}
            targetStatus={statusTarget.nextStatus}
            onConfirm={handleStatusConfirm}
          />

          {/* Manage Agents Modal */}
          <ManageAgentsModal
            isOpen={!!managingAgentsTarget}
            onClose={() => setManagingAgentsTarget(null)}
            manager={managingAgentsTarget}
            assignedAgents={selectedManagerDetail.agents || []}
            availableAgents={agentPool}
            onAssign={handleAssignAgent}
            onUnassign={handleUnassignAgent}
          />
        </>
      );
    }

    // Invalid / missing manager ID route (e.g. /managers/invalid)
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Management', onClick: clearSelectedManager },
            { label: 'Managers', onClick: clearSelectedManager },
            { label: 'Not Found' },
          ]}
        />
        <NotFoundState
          title="Manager Account Not Found"
          resourceName="Manager Profile"
          resourceId={selectedManagerId}
          onBack={clearSelectedManager}
        />
      </div>
    );
  }

  // Table Columns Definition
  const columns: ColumnDef<ManagerItem>[] = [
    {
      key: 'name',
      header: 'Manager',
      render: (manager) => {
        const initials = manager.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('');

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  selectManager(manager.id);
                }}
                className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer truncate"
              >
                {manager.name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                {manager.email}
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
      render: (manager) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {manager.email}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'department',
      header: 'Department',
      render: (manager) => (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)]">
          <Building className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
          <span>{manager.department}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (manager) => (
        <Badge variant={getStatusBadgeVariant(manager.status)} size="sm">
          {manager.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'agents',
      header: 'Agents',
      render: (manager) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {manager.assignedAgentsCount}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (manager) => (
        <div className="w-36">
          <CapacityIndicator
            current={manager.assignedAgentsCount}
            max={manager.maxAgents}
            size="sm"
            showLabels={true}
          />
        </div>
      ),
      sortable: true,
    },
    {
      key: 'available',
      header: 'Available Slots',
      render: (manager) => (
        <span
          className={`font-mono text-xs font-bold ${
            manager.availableSlots > 0 ? 'text-[var(--accent-emerald)]' : 'text-[var(--accent-rose)]'
          }`}
        >
          {manager.availableSlots} slots
        </span>
      ),
      sortable: true,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (manager) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {formatDate(manager.createdAt)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (manager) => (
        <div className="flex items-center justify-end">
          <MoreActionsMenu
            ariaLabel={`Actions for ${manager.name}`}
            items={[
              {
                id: 'view',
                label: 'View Manager Profile',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: () => selectManager(manager.id),
              },
              {
                id: 'edit',
                label: 'Edit Manager',
                icon: <Edit2 className="w-3.5 h-3.5" />,
                onClick: () => setEditingManager(manager),
              },
              {
                id: 'agents',
                label: 'Manage Supervised Agents',
                icon: <Users className="w-3.5 h-3.5" />,
                onClick: () => setManagingAgentsTarget(manager),
              },
              {
                id: 'status',
                label: manager.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account',
                icon: <Power className="w-3.5 h-3.5" />,
                isDangerous: manager.status === 'ACTIVE',
                confirmTitle: `Suspend Manager ${manager.name}`,
                confirmMessage: `Are you sure you want to suspend manager account ${manager.email}? Their supervision scope and management abilities will be frozen.`,
                onClick: () => handleOpenStatusModal(manager),
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
        title="Managers"
        description="Manage manager accounts, capacity and agent supervision."
        breadcrumbs={[{ label: 'Management' }, { label: 'Managers' }]}
        primaryAction={{
          label: 'Create Manager',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-3.5 h-3.5" />,
          id: 'btn-create-manager',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh Managers telemetry"
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
              title="Total Managers"
              value={formatNumber(kpis.totalManagers)}
              subtext="Platform supervisors"
              icon={Users}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="Hierarchy"
              badgeVariant="info"
            />
            <StatCard
              title="Active Managers"
              value={formatNumber(kpis.activeManagers)}
              subtext="Authorized & operational"
              icon={UserCheck}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Healthy"
              badgeVariant="success"
            />
            <StatCard
              title="Suspended Managers"
              value={formatNumber(kpis.suspendedManagers)}
              subtext="Restricted credentials"
              icon={ShieldAlert}
              iconBgColor="bg-[var(--accent-rose-dim)] text-[var(--accent-rose)]"
              badgeText={kpis.suspendedManagers > 0 ? 'Review' : 'Zero'}
              badgeVariant={kpis.suspendedManagers > 0 ? 'error' : 'neutral'}
            />
            <StatCard
              title="Available Agent Capacity"
              value={formatNumber(kpis.availableCapacity)}
              subtext={`${kpis.totalAssignedAgents} of ${kpis.totalMaxCapacity} assigned`}
              icon={Gauge}
              iconBgColor="bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]"
              badgeText="Slots"
              badgeVariant="purple"
            />
          </>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search by manager name, email, or department..."
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
            key: 'department',
            label: 'Department',
            value: filterState.department,
            options: [
              { label: 'All Departments', value: 'ALL' },
              ...departments.map((d) => ({ label: d, value: d })),
            ],
            onChange: (val) => updateFilter('department', val),
          },
          {
            key: 'capacityStatus',
            label: 'Capacity',
            value: filterState.capacityStatus,
            options: [
              { label: 'All Capacities', value: 'ALL' },
              { label: 'Available Slots', value: 'AVAILABLE' },
              { label: 'Near Capacity (≥80%)', value: 'NEAR_CAPACITY' },
              { label: 'Full (100%)', value: 'FULL' },
            ],
            onChange: (val) => updateFilter('capacityStatus', val),
          },
          {
            key: 'sortBy',
            label: 'Sort By',
            value: filterState.sortBy,
            options: [
              { label: 'Date Created', value: 'createdAt' },
              { label: 'Name', value: 'name' },
              { label: 'Department', value: 'department' },
              { label: 'Assigned Agents', value: 'agents' },
              { label: 'Capacity %', value: 'capacity' },
              { label: 'Available Slots', value: 'available' },
            ],
            onChange: (val) => updateFilter('sortBy', val as ManagersSortField),
          },
        ]}
        onReset={resetFilters}
      />

      {/* Main Table / State View */}
      {error ? (
        <ErrorState
          title="Failed to Load Managers"
          message={error}
          onRetry={refresh}
        />
      ) : managers.length === 0 && !isLoading ? (
        <EmptyState
          title="No managers found"
          message="No manager profiles match your active search and status filter criteria."
          icon={Users}
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={managers}
            keyExtractor={(m) => m.id}
            isLoading={isLoading}
            onRowClick={(m) => selectManager(m.id)}
            emptyMessage="No managers available"
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

      {/* Create Manager Modal */}
      <CreateManagerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        departments={departments}
      />

      {/* Edit Manager Modal */}
      <EditManagerModal
        isOpen={!!editingManager}
        onClose={() => setEditingManager(null)}
        manager={editingManager}
        onSubmit={handleEditSubmit}
        departments={departments}
      />

      {/* Status Transition Modal */}
      <ManagerStatusModal
        isOpen={!!statusTarget.manager}
        onClose={() => setStatusTarget({ manager: null, nextStatus: null })}
        manager={statusTarget.manager}
        targetStatus={statusTarget.nextStatus}
        onConfirm={handleStatusConfirm}
      />

      {/* Manage Agents Modal */}
      <ManageAgentsModal
        isOpen={!!managingAgentsTarget}
        onClose={() => setManagingAgentsTarget(null)}
        manager={managingAgentsTarget}
        assignedAgents={
          managingAgentsTarget
            ? managers.find((m) => m.id === managingAgentsTarget.id)?.assignedAgentsCount
              ? // Pull from active seed or cached agents
                agentPool
                  .filter((a) => a.assignedManagerId === managingAgentsTarget.id)
                  .map((a) => ({
                    id: a.id,
                    userId: `usr-${a.id}`,
                    name: a.name,
                    email: a.email,
                    status: a.status,
                    assignedAt: new Date().toISOString(),
                    clientsCount: a.clientsCount,
                  }))
              : []
            : []
        }
        availableAgents={agentPool}
        onAssign={handleAssignAgent}
        onUnassign={handleUnassignAgent}
      />
    </div>
  );
};
