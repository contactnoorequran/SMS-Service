/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNumbers } from '../../hooks/useNumbers';
import {
  NumberItem,
  NumberDetail,
  NumberStatus,
  NumbersSortField,
  CreateNumberPayload,
  AssignNumberPayload,
  ReassignNumberPayload,
  ReleaseNumberPayload,
} from '../../types/numbers';
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

import { AssignNumberModal } from './numbers/AssignNumberModal';
import { ReassignNumberModal } from './numbers/ReassignNumberModal';
import { ReleaseNumberModal } from './numbers/ReleaseNumberModal';
import { NumberStatusModal } from './numbers/NumberStatusModal';
import { CreateNumberModal } from './numbers/CreateNumberModal';
import { NumberDetailsView } from './numbers/NumberDetailsView';

import {
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from '../../utils/formatters';
import {
  Hash,
  Globe,
  Radio,
  Server,
  Building2,
  User,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Clock,
  RefreshCw,
  Plus,
  Eye,
  UserCheck,
  PowerOff,
  Power,
  Layers,
  Activity,
  Percent,
} from 'lucide-react';

export const NumberManagementView: React.FC = () => {
  const {
    numbers,
    totalCount,
    kpis,
    filterState,
    totalPages,
    countries,
    operators,
    providers,
    ranges,
    clients,
    agents,
    isLoading,
    isRefreshing,
    error,
    selectedNumberId,
    selectedNumberDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectNumber,
    clearSelectedNumber,
    createNumber,
    updateNumberStatus,
    assignNumber,
    reassignNumber,
    releaseNumber,
    refresh,
  } = useNumbers();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<NumberItem | NumberDetail | null>(null);
  const [reassignTarget, setReassignTarget] = useState<NumberItem | NumberDetail | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<NumberItem | NumberDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    number: NumberItem | NumberDetail | null;
    nextStatus: NumberStatus | null;
  }>({
    number: null,
    nextStatus: null,
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const getStatusBadgeVariant = (status: NumberStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'ASSIGNED':
        return 'info';
      case 'RESERVED':
        return 'warning';
      case 'SUSPENDED':
      case 'DECOMMISSIONED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  // Handlers for modal submissions
  const handleCreateSubmit = async (payload: CreateNumberPayload) => {
    try {
      await createNumber(payload);
      showToast(`Phone number ${payload.e164} registered into inventory`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to register phone number', 'error');
      throw err;
    }
  };

  const handleAssignSubmit = async (numberId: string, payload: AssignNumberPayload) => {
    try {
      await assignNumber(numberId, payload);
      showToast('Number allocated to client successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to allocate phone number', 'error');
      throw err;
    }
  };

  const handleReassignSubmit = async (numberId: string, payload: ReassignNumberPayload) => {
    try {
      await reassignNumber(numberId, payload);
      showToast('Number reassigned to new client successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reassign phone number', 'error');
      throw err;
    }
  };

  const handleReleaseSubmit = async (numberId: string, payload: ReleaseNumberPayload) => {
    try {
      await releaseNumber(numberId, payload);
      showToast('Number released back to available inventory pool');
    } catch (err: any) {
      showToast(err?.message || 'Failed to release phone number', 'error');
      throw err;
    }
  };

  const handleStatusConfirm = async (numberId: string, newStatus: NumberStatus, reason?: string) => {
    try {
      await updateNumberStatus(numberId, newStatus, reason);
      showToast(`Number status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to change number status', 'error');
      throw err;
    }
  };

  // If viewing single number detail (/numbers/:id)
  if (selectedNumberId) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Operations', onClick: clearSelectedNumber },
              { label: 'Numbers', onClick: clearSelectedNumber },
              { label: 'Loading telemetry...' },
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

    if (selectedNumberDetail) {
      return (
        <>
          <NumberDetailsView
            number={selectedNumberDetail}
            onBack={clearSelectedNumber}
            onAssign={(n) => setAssignTarget(n)}
            onReassign={(n) => setReassignTarget(n)}
            onRelease={(n) => setReleaseTarget(n)}
            onStatusChange={(n, nextStatus) => setStatusTarget({ number: n, nextStatus })}
          />

          {/* Assign Modal */}
          <AssignNumberModal
            isOpen={!!assignTarget}
            onClose={() => setAssignTarget(null)}
            number={assignTarget}
            clients={clients}
            agents={agents}
            onSubmit={handleAssignSubmit}
          />

          {/* Reassign Modal */}
          <ReassignNumberModal
            isOpen={!!reassignTarget}
            onClose={() => setReassignTarget(null)}
            number={reassignTarget}
            clients={clients}
            agents={agents}
            onSubmit={handleReassignSubmit}
          />

          {/* Release Modal */}
          <ReleaseNumberModal
            isOpen={!!releaseTarget}
            onClose={() => setReleaseTarget(null)}
            number={releaseTarget}
            onSubmit={handleReleaseSubmit}
          />

          {/* Status Modal */}
          <NumberStatusModal
            isOpen={!!statusTarget.number}
            onClose={() => setStatusTarget({ number: null, nextStatus: null })}
            number={statusTarget.number}
            targetStatus={statusTarget.nextStatus}
            onConfirm={handleStatusConfirm}
          />
        </>
      );
    }

    // Invalid / missing number ID route (e.g. /numbers/invalid)
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Operations', onClick: clearSelectedNumber },
            { label: 'Numbers', onClick: clearSelectedNumber },
            { label: 'Not Found' },
          ]}
        />
        <NotFoundState
          title="Phone Number Not Found"
          resourceName="Phone Number"
          resourceId={selectedNumberId}
          onBack={clearSelectedNumber}
        />
      </div>
    );
  }

  // Table Columns Definition
  const columns: ColumnDef<NumberItem>[] = [
    {
      key: 'e164',
      header: 'E.164 Number',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {item.country.flag || <Hash className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-mono font-bold text-sm text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors">
              {item.e164}
            </span>
            <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
              <span>{item.country.name}</span>
              <span>•</span>
              <span>{item.operator?.name || 'Direct'}</span>
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'provider',
      header: 'Carrier Provider',
      render: (item) => (
        <div>
          <span className="font-semibold text-xs text-[var(--text-primary)] block">
            {item.provider.name}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {item.provider.connectionHealth || 'HEALTHY'} BIND
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'range',
      header: 'Allocated Range',
      render: (item) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {item.range ? `${item.range.startE164}…` : 'Single DID'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={getStatusBadgeVariant(item.status)}>
          {item.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'assignment',
      header: 'Active Assignment',
      render: (item) => {
        if (item.activeAssignment) {
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] flex items-center justify-center text-[10px] font-bold shrink-0">
                <Building2 className="w-3 h-3" />
              </div>
              <div>
                <span className="font-semibold text-xs text-[var(--text-primary)] block truncate max-w-[140px]">
                  {item.activeAssignment.client.companyName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {item.activeAssignment.agent ? item.activeAssignment.agent.name : 'Platform Direct'}
                </span>
              </div>
            </div>
          );
        }
        return (
          <span className="text-xs text-[var(--text-muted)] italic">
            Unassigned (Pool)
          </span>
        );
      },
    },
    {
      key: 'messages',
      header: 'Total Traffic',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {formatNumber(item.totalMessages)} SMS
        </span>
      ),
      sortable: true,
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: (item) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {item.lastActivityAt ? formatRelativeTime(item.lastActivityAt) : 'Never'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center justify-end">
          <MoreActionsMenu
            ariaLabel={`Actions for ${item.e164}`}
            items={[
              {
                id: 'view',
                label: 'View Details & History',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: () => selectNumber(item.id),
              },
              ...(item.status === 'AVAILABLE'
                ? [
                    {
                      id: 'assign',
                      label: 'Assign to Client',
                      icon: <UserCheck className="w-3.5 h-3.5" />,
                      onClick: () => setAssignTarget(item),
                    },
                  ]
                : []),
              ...(item.status === 'ASSIGNED' && item.activeAssignment
                ? [
                    {
                      id: 'reassign',
                      label: 'Reassign Client',
                      icon: <RefreshCw className="w-3.5 h-3.5" />,
                      onClick: () => setReassignTarget(item),
                    },
                  ]
                : []),
              ...(item.status !== 'DECOMMISSIONED'
                ? [
                    {
                      id: 'status',
                      label: item.status === 'SUSPENDED' ? 'Activate Number' : 'Suspend Number',
                      icon: item.status === 'SUSPENDED' ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />,
                      onClick: () =>
                        setStatusTarget({
                          number: item,
                          nextStatus: item.status === 'SUSPENDED' ? (item.activeAssignment ? 'ASSIGNED' : 'AVAILABLE') : 'SUSPENDED',
                        }),
                    },
                  ]
                : []),
              ...(item.status === 'ASSIGNED' && item.activeAssignment
                ? [
                    {
                      id: 'release',
                      label: 'Release to Pool',
                      icon: <PowerOff className="w-3.5 h-3.5" />,
                      isDangerous: true,
                      confirmTitle: `Release Number ${item.e164}`,
                      confirmMessage: `Are you sure you want to release ${item.e164} from ${item.activeAssignment.client.companyName}? Active inbound message routing will cease immediately.`,
                      onClick: () => setReleaseTarget(item),
                    },
                  ]
                : []),
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

      {/* Page Header Standard Pattern */}
      <PageHeader
        title="Phone Numbers & Ranges"
        description="E.164 phone number inventory, active client assignments, carrier ranges, and routing utilization."
        breadcrumbs={[{ label: 'Telecom' }, { label: 'Numbers' }]}
        primaryAction={{
          label: 'Register Number',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-3.5 h-3.5" />,
          id: 'btn-register-number',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh numbers telemetry"
          >
            Refresh
          </Button>
        }
      />

      {/* KPI Cards Row (8 KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Numbers"
              value={formatNumber(kpis.totalNumbers)}
              subtext="Total inventory"
              icon={Hash}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="Inventory"
              badgeVariant="info"
            />
            <StatCard
              title="Available"
              value={formatNumber(kpis.availableNumbers)}
              subtext="Ready for client"
              icon={CheckCircle2}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Unassigned"
              badgeVariant="success"
            />
            <StatCard
              title="Assigned"
              value={formatNumber(kpis.assignedNumbers)}
              subtext="Active routing"
              icon={Building2}
              iconBgColor="bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]"
              badgeText="In Service"
              badgeVariant="purple"
            />
            <StatCard
              title="Suspended"
              value={formatNumber(kpis.suspendedNumbers)}
              subtext="Traffic held"
              icon={ShieldAlert}
              iconBgColor="bg-[var(--accent-rose-dim)] text-[var(--accent-rose)]"
              badgeText={kpis.suspendedNumbers > 0 ? 'Review' : 'Zero'}
              badgeVariant={kpis.suspendedNumbers > 0 ? 'error' : 'neutral'}
            />
            <StatCard
              title="Providers"
              value={formatNumber(kpis.providersCount)}
              subtext="Carriers linked"
              icon={Radio}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="Carriers"
              badgeVariant="info"
            />
            <StatCard
              title="Countries"
              value={formatNumber(kpis.countriesCount)}
              subtext="Global coverage"
              icon={Globe}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Jurisdictions"
              badgeVariant="success"
            />
            <StatCard
              title="Utilization"
              value={formatPercent(kpis.assignmentUtilization)}
              subtext="Allocated ratio"
              icon={Percent}
              iconBgColor="bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]"
              badgeText="Capacity"
              badgeVariant="purple"
            />
            <StatCard
              title="Recent Additions"
              value={formatNumber(kpis.recentlyAddedCount)}
              subtext="Added in 90d"
              icon={Clock}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="New"
              badgeVariant="info"
            />
          </>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search by E.164 (+1...), operator, provider, or client..."
        searchValue={filterState.search}
        onSearchChange={(val) => updateFilter('search', val)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: filterState.status,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Available', value: 'AVAILABLE' },
              { label: 'Assigned', value: 'ASSIGNED' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Reserved', value: 'RESERVED' },
              { label: 'Decommissioned', value: 'DECOMMISSIONED' },
            ],
            onChange: (val) => updateFilter('status', val),
          },
          {
            key: 'assignmentState',
            label: 'Assignment State',
            value: filterState.assignmentState,
            options: [
              { label: 'All States', value: 'ALL' },
              { label: 'Assigned to Client', value: 'ASSIGNED' },
              { label: 'Unassigned Pool', value: 'AVAILABLE' },
            ],
            onChange: (val) => updateFilter('assignmentState', val),
          },
          {
            key: 'countryId',
            label: 'Country',
            value: filterState.countryId,
            options: [
              { label: 'All Countries', value: 'ALL' },
              ...countries.map((c) => ({ label: `${c.flag || ''} ${c.name} (${c.dialCode})`, value: c.id })),
            ],
            onChange: (val) => updateFilter('countryId', val),
          },
          {
            key: 'providerId',
            label: 'Provider',
            value: filterState.providerId,
            options: [
              { label: 'All Providers', value: 'ALL' },
              ...providers.map((p) => ({ label: p.name, value: p.id })),
            ],
            onChange: (val) => updateFilter('providerId', val),
          },
          {
            key: 'operatorId',
            label: 'Operator',
            value: filterState.operatorId,
            options: [
              { label: 'All Operators', value: 'ALL' },
              ...operators.map((op) => ({ label: op.name, value: op.id })),
            ],
            onChange: (val) => updateFilter('operatorId', val),
          },
          {
            key: 'clientId',
            label: 'Client',
            value: filterState.clientId,
            options: [
              { label: 'All Clients', value: 'ALL' },
              ...clients.map((cl) => ({ label: cl.companyName, value: cl.id })),
            ],
            onChange: (val) => updateFilter('clientId', val),
          },
          {
            key: 'sortBy',
            label: 'Sort By',
            value: filterState.sortBy,
            options: [
              { label: 'Date Added', value: 'createdAt' },
              { label: 'E.164 Number', value: 'e164' },
              { label: 'Country', value: 'country' },
              { label: 'Operator', value: 'operator' },
              { label: 'Provider', value: 'provider' },
              { label: 'Status', value: 'status' },
              { label: 'SMS Traffic', value: 'messages' },
              { label: 'Last Activity', value: 'lastActivity' },
            ],
            onChange: (val) => updateFilter('sortBy', val as NumbersSortField),
          },
        ]}
        onReset={resetFilters}
      />

      {/* Main Table / State View */}
      {error ? (
        <ErrorState
          title="Failed to Load Phone Numbers"
          message={error}
          onRetry={refresh}
        />
      ) : numbers.length === 0 && !isLoading ? (
        <EmptyState
          title="No phone numbers found"
          message="No E.164 phone lines match your active search, operator, or status filter criteria."
          icon={Hash}
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={numbers}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            onRowClick={(item) => selectNumber(item.id)}
            emptyMessage="No phone numbers in inventory"
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

      {/* Create Number Modal */}
      <CreateNumberModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        countries={countries}
        operators={operators}
        providers={providers}
        ranges={ranges}
        onSubmit={handleCreateSubmit}
      />

      {/* Assign Modal */}
      <AssignNumberModal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        number={assignTarget}
        clients={clients}
        agents={agents}
        onSubmit={handleAssignSubmit}
      />

      {/* Reassign Modal */}
      <ReassignNumberModal
        isOpen={!!reassignTarget}
        onClose={() => setReassignTarget(null)}
        number={reassignTarget}
        clients={clients}
        agents={agents}
        onSubmit={handleReassignSubmit}
      />

      {/* Release Modal */}
      <ReleaseNumberModal
        isOpen={!!releaseTarget}
        onClose={() => setReleaseTarget(null)}
        number={releaseTarget}
        onSubmit={handleReleaseSubmit}
      />

      {/* Status Modal */}
      <NumberStatusModal
        isOpen={!!statusTarget.number}
        onClose={() => setStatusTarget({ number: null, nextStatus: null })}
        number={statusTarget.number}
        targetStatus={statusTarget.nextStatus}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
};
