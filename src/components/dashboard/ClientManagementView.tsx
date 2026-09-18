/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClients } from '../../hooks/useClients';
import {
  ClientItem,
  ClientDetail,
  ClientStatus,
  BillingType,
  ClientsSortField,
  CreateClientPayload,
  UpdateClientPayload,
} from '../../types/clients';
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

import { CreateClientModal } from './clients/CreateClientModal';
import { EditClientModal } from './clients/EditClientModal';
import { ClientStatusModal } from './clients/ClientStatusModal';
import { AssignAgentModal } from './clients/AssignAgentModal';
import { ClientTransactionsModal } from './clients/ClientTransactionsModal';
import { ClientDetailsView } from './clients/ClientDetailsView';

import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
} from '../../utils/formatters';
import {
  Building2,
  Users,
  ShieldAlert,
  Hash,
  DollarSign,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Power,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  FileText,
} from 'lucide-react';

export const ClientManagementView: React.FC = () => {
  const {
    clients,
    totalCount,
    kpis,
    agents,
    managers,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    error,
    selectedClientId,
    selectedClientDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectClient,
    clearSelectedClient,
    createClient,
    updateClient,
    updateClientStatus,
    assignAgent,
    refresh,
  } = useClients();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | ClientDetail | null>(null);
  const [assigningAgentTarget, setAssigningAgentTarget] = useState<ClientItem | ClientDetail | null>(null);
  const [viewingTransactionsTarget, setViewingTransactionsTarget] = useState<ClientDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    client: ClientItem | ClientDetail | null;
    nextStatus: ClientStatus | null;
  }>({
    client: null,
    nextStatus: null,
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const getStatusBadgeVariant = (status: ClientStatus) => {
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

  const handleOpenStatusModal = (client: ClientItem | ClientDetail) => {
    const nextStatus: ClientStatus = client.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusTarget({
      client,
      nextStatus,
    });
  };

  const handleCreateSubmit = async (payload: CreateClientPayload) => {
    try {
      await createClient(payload);
      showToast(`Client "${payload.companyName}" created successfully`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create client account', 'error');
      throw err;
    }
  };

  const handleEditSubmit = async (id: string, payload: UpdateClientPayload) => {
    try {
      await updateClient(id, payload);
      showToast('Client profile updated successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update client', 'error');
      throw err;
    }
  };

  const handleStatusConfirm = async (id: string, newStatus: ClientStatus, reason?: string) => {
    try {
      await updateClientStatus(id, newStatus, reason);
      showToast(`Client status changed to ${newStatus}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to change client status', 'error');
      throw err;
    }
  };

  const handleAssignAgentConfirm = async (clientId: string, agentId: string | null) => {
    try {
      await assignAgent(clientId, agentId);
      showToast('Supervising agent assignment updated successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to assign agent', 'error');
      throw err;
    }
  };

  // If viewing details for /clients/:id
  if (selectedClientId) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Management', onClick: clearSelectedClient },
              { label: 'Clients', onClick: clearSelectedClient },
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

    if (selectedClientDetail) {
      return (
        <>
          <ClientDetailsView
            client={selectedClientDetail}
            onBack={clearSelectedClient}
            onEdit={(c) => setEditingClient(c)}
            onStatusChange={(c) => handleOpenStatusModal(c)}
            onAssignAgent={(c) => setAssigningAgentTarget(c)}
            onViewTransactions={(c) => setViewingTransactionsTarget(c)}
          />

          {/* Edit Modal */}
          <EditClientModal
            isOpen={!!editingClient}
            onClose={() => setEditingClient(null)}
            client={editingClient}
            onSubmit={handleEditSubmit}
            agents={agents}
          />

          {/* Status Modal */}
          <ClientStatusModal
            isOpen={!!statusTarget.client}
            onClose={() => setStatusTarget({ client: null, nextStatus: null })}
            client={statusTarget.client}
            targetStatus={statusTarget.nextStatus}
            onConfirm={handleStatusConfirm}
          />

          {/* Assign Agent Modal */}
          <AssignAgentModal
            isOpen={!!assigningAgentTarget}
            onClose={() => setAssigningAgentTarget(null)}
            client={assigningAgentTarget}
            agents={agents}
            onConfirm={handleAssignAgentConfirm}
          />

          {/* Financial Transactions Modal */}
          <ClientTransactionsModal
            isOpen={!!viewingTransactionsTarget}
            onClose={() => setViewingTransactionsTarget(null)}
            client={viewingTransactionsTarget}
          />
        </>
      );
    }

    // Invalid / missing client ID route (e.g. /clients/invalid)
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Management', onClick: clearSelectedClient },
            { label: 'Clients', onClick: clearSelectedClient },
            { label: 'Not Found' },
          ]}
        />
        <NotFoundState
          title="Client Account Not Found"
          resourceName="Client Profile"
          resourceId={selectedClientId}
          onBack={clearSelectedClient}
        />
      </div>
    );
  }

  // Table Columns Definition
  const columns: ColumnDef<ClientItem>[] = [
    {
      key: 'name',
      header: 'Client Identity',
      render: (client) => {
        const initials = client.companyName
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
                  selectClient(client.id);
                }}
                className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors cursor-pointer truncate"
              >
                {client.companyName}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">
                Contact: {client.name} • <span className="font-mono">{client.id}</span>
              </div>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'email',
      header: 'Operations Email',
      render: (client) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {client.email}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'agent',
      header: 'Supervising Agent',
      render: (client) =>
        client.agentName ? (
          <div>
            <div className="text-xs font-medium text-[var(--text-primary)]">{client.agentName}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">{client.agentEmail}</div>
          </div>
        ) : (
          <Badge variant="neutral" size="sm">Platform Direct</Badge>
        ),
      sortable: true,
    },
    {
      key: 'manager',
      header: 'Manager',
      render: (client) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {client.managerName || 'Operations'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'billingType',
      header: 'Billing Model',
      render: (client) => (
        <Badge variant={client.billingType === 'POSTPAID' ? 'info' : 'purple'} size="sm">
          {client.billingType}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (client) => (
        <Badge variant={getStatusBadgeVariant(client.status)} size="sm">
          {client.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'numbers',
      header: 'Assigned DIDs',
      render: (client) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--accent-purple)] font-medium">
          <Phone className="w-3 h-3" />
          {client.assignedNumbersCount || 0}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'smsCount',
      header: 'Monthly Volume',
      render: (client) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {formatNumber(client.smsCount)} SMS
        </span>
      ),
      sortable: true,
    },
    {
      key: 'balance',
      header: 'Wallet Balance',
      render: (client) => (
        <span className="font-mono text-xs font-bold text-[var(--accent-emerald)]">
          {formatCurrency(client.balance)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: (client) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {client.lastLoginAt ? formatRelativeTime(client.lastLoginAt) : 'Never'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (client) => (
        <div className="flex items-center justify-end">
          <MoreActionsMenu
            ariaLabel={`Actions for ${client.companyName}`}
            items={[
              {
                id: 'view',
                label: 'View Client Profile',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: () => selectClient(client.id),
              },
              {
                id: 'edit',
                label: 'Edit Client',
                icon: <Edit2 className="w-3.5 h-3.5" />,
                onClick: () => setEditingClient(client),
              },
              {
                id: 'agent',
                label: 'Reassign Agent',
                icon: <UserCheck className="w-3.5 h-3.5" />,
                onClick: () => setAssigningAgentTarget(client),
              },
              {
                id: 'status',
                label: client.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account',
                icon: <Power className="w-3.5 h-3.5" />,
                isDangerous: client.status === 'ACTIVE',
                confirmTitle: `Suspend Client ${client.companyName}`,
                confirmMessage: `Are you sure you want to suspend client ${client.companyName}? Inbound message forwarding and API credentials will be temporarily restricted.`,
                onClick: () => handleOpenStatusModal(client),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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
        title="Clients"
        description="Enterprise customer portfolio, assigned agents, wallet ledger, API authorization, and SMS metrics."
        breadcrumbs={[{ label: 'Management' }, { label: 'Clients' }]}
        primaryAction={{
          label: 'Create Client',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-3.5 h-3.5" />,
          id: 'btn-create-client',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh Clients telemetry"
          >
            Refresh
          </Button>
        }
      />

      {/* Executive KPI Summary (5 StatCards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Clients"
              value={formatNumber(kpis.totalClients)}
              subtext="Enterprise account portfolio"
              icon={Building2}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="Portfolio"
              badgeVariant="info"
            />
            <StatCard
              title="Active Clients"
              value={formatNumber(kpis.activeClients)}
              subtext="Traffic dispatching authorized"
              icon={CheckCircle2}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Operational"
              badgeVariant="success"
            />
            <StatCard
              title="Suspended Clients"
              value={formatNumber(kpis.suspendedClients)}
              subtext="Compliance or credit exhaustion"
              icon={ShieldAlert}
              iconBgColor="bg-[var(--accent-rose-dim)] text-[var(--accent-rose)]"
              badgeText={kpis.suspendedClients > 0 ? 'Review' : 'Zero'}
              badgeVariant={kpis.suspendedClients > 0 ? 'error' : 'neutral'}
            />
            <StatCard
              title="Total Assigned Numbers"
              value={formatNumber(kpis.totalAssignedNumbers)}
              subtext="Allocated E.164 phone lines"
              icon={Hash}
              iconBgColor="bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]"
              badgeText="Inventory"
              badgeVariant="purple"
            />
            <StatCard
              title="Total Wallet Balance"
              value={formatCurrency(kpis.totalWalletBalance)}
              subtext={`Avg. ${formatCurrency(kpis.averageBalance)} • ${formatNumber(kpis.totalSmsCount)} SMS`}
              icon={DollarSign}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Commercial"
              badgeVariant="success"
            />
          </>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search by client name, email, or company..."
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
            key: 'billingType',
            label: 'Billing Model',
            value: filterState.billingType,
            options: [
              { label: 'All Models', value: 'ALL' },
              { label: 'Prepaid (Wallet)', value: 'PREPAID' },
              { label: 'Postpaid (Credit Line)', value: 'POSTPAID' },
            ],
            onChange: (val) => updateFilter('billingType', val),
          },
          {
            key: 'agentId',
            label: 'Agent',
            value: filterState.agentId,
            options: [
              { label: 'All Agents', value: 'ALL' },
              { label: 'Platform Direct (Unassigned)', value: 'UNASSIGNED' },
              ...agents.map((a) => ({ label: `${a.name} (${a.clientsCount} clients)`, value: a.id })),
            ],
            onChange: (val) => updateFilter('agentId', val),
          },
          {
            key: 'managerId',
            label: 'Manager',
            value: filterState.managerId,
            options: [
              { label: 'All Managers', value: 'ALL' },
              ...managers.map((m) => ({ label: `${m.name} (${m.department})`, value: m.id })),
            ],
            onChange: (val) => updateFilter('managerId', val),
          },
          {
            key: 'balanceRange',
            label: 'Balance Range',
            value: filterState.balanceRange,
            options: [
              { label: 'All Balances', value: 'ALL' },
              { label: '$0 Balance (Exhausted)', value: 'ZERO' },
              { label: '$1 - $1,000', value: '1-1000' },
              { label: '$1,001 - $10,000', value: '1001-10000' },
              { label: '$10,000+ (High Volume)', value: '10000+' },
            ],
            onChange: (val) => updateFilter('balanceRange', val),
          },
          {
            key: 'sortBy',
            label: 'Sort By',
            value: filterState.sortBy,
            options: [
              { label: 'Date Created', value: 'createdAt' },
              { label: 'Company Name', value: 'companyName' },
              { label: 'Contact Name', value: 'name' },
              { label: 'Wallet Balance', value: 'balance' },
              { label: 'SMS Volume', value: 'smsCount' },
              { label: 'Assigned Numbers', value: 'numbers' },
              { label: 'Last Activity', value: 'lastActivity' },
            ],
            onChange: (val) => updateFilter('sortBy', val as ClientsSortField),
          },
        ]}
        onReset={resetFilters}
      />

      {/* Main Table / State View */}
      {error ? (
        <ErrorState
          title="Failed to Load Clients"
          message={error}
          onRetry={refresh}
        />
      ) : clients.length === 0 && !isLoading ? (
        <EmptyState
          title="No clients found"
          message="No client enterprise accounts match your active search and filter criteria."
          icon={Building2}
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={clients}
            keyExtractor={(c) => c.id}
            isLoading={isLoading}
            onRowClick={(c) => selectClient(c.id)}
            emptyMessage="No clients available"
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

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        agents={agents}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        onSubmit={handleEditSubmit}
        agents={agents}
      />

      {/* Status Modal */}
      <ClientStatusModal
        isOpen={!!statusTarget.client}
        onClose={() => setStatusTarget({ client: null, nextStatus: null })}
        client={statusTarget.client}
        targetStatus={statusTarget.nextStatus}
        onConfirm={handleStatusConfirm}
      />

      {/* Assign Agent Modal */}
      <AssignAgentModal
        isOpen={!!assigningAgentTarget}
        onClose={() => setAssigningAgentTarget(null)}
        client={assigningAgentTarget}
        agents={agents}
        onConfirm={handleAssignAgentConfirm}
      />
    </div>
  );
};
