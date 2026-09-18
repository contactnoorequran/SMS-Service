/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useProviders } from '../../hooks/useProviders';
import {
  ProviderItem,
  ProviderDetail,
  ProviderStatus,
  ProviderType,
  ProvidersSortField,
  CreateProviderPayload,
  UpdateProviderPayload,
  CreateConnectionPayload,
  UpdateConnectionPayload,
  ProviderConnectionSummary,
} from '../../types/providers';
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

import { CreateProviderModal } from './providers/CreateProviderModal';
import { EditProviderModal } from './providers/EditProviderModal';
import { ProviderStatusModal } from './providers/ProviderStatusModal';
import { ManageConnectionModal } from './providers/ManageConnectionModal';
import { ProviderConnectionDetailsModal } from './providers/ProviderConnectionDetailsModal';
import { ProviderDetailsView } from './providers/ProviderDetailsView';

import {
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from '../../utils/formatters';
import {
  Radio,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Hash,
  Globe,
  RefreshCw,
  Plus,
  Eye,
  Edit2,
  Power,
  Layers,
  Zap,
  Cable,
  Send,
  ShieldCheck,
} from 'lucide-react';

export const ProviderManagementView: React.FC = () => {
  const {
    providers,
    totalCount,
    kpis,
    filterState,
    totalPages,
    isLoading,
    isRefreshing,
    error,
    selectedProviderId,
    selectedProviderDetail,
    isLoadingDetail,
    updateFilter,
    resetFilters,
    selectProvider,
    clearSelectedProvider,
    createProvider,
    updateProvider,
    updateProviderStatus,
    createConnection,
    updateConnection,
    updateConnectionStatus,
    testConnection,
    refresh,
  } = useProviders();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderItem | ProviderDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    provider: ProviderItem | ProviderDetail | null;
    nextStatus: ProviderStatus | null;
  }>({
    provider: null,
    nextStatus: null,
  });

  // Connection modals state
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);
  const [editingConnectionTarget, setEditingConnectionTarget] = useState<ProviderConnectionSummary | null>(null);
  const [inspectingConnectionTarget, setInspectingConnectionTarget] = useState<ProviderConnectionSummary | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const getStatusBadgeVariant = (status: ProviderStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'HEALTHY':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'DOWN':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getTypeBadgeVariant = (type: ProviderType) => {
    switch (type) {
      case 'TIER_1_CARRIER':
        return 'purple';
      case 'DIRECT_SMPP':
        return 'info';
      case 'AGGREGATOR':
        return 'warning';
      case 'CLOUD_GATEWAY':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const handleOpenStatusModal = (provider: ProviderItem | ProviderDetail) => {
    const nextStatus: ProviderStatus = provider.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusTarget({
      provider,
      nextStatus,
    });
  };

  const handleCreateSubmit = async (payload: CreateProviderPayload) => {
    try {
      await createProvider(payload);
      showToast(`Provider "${payload.name}" provisioned successfully`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to register provider', 'error');
      throw err;
    }
  };

  const handleEditSubmit = async (id: string, payload: UpdateProviderPayload) => {
    try {
      await updateProvider(id, payload);
      showToast('Provider profile updated successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update provider', 'error');
      throw err;
    }
  };

  const handleStatusConfirm = async (id: string, newStatus: ProviderStatus, reason?: string) => {
    try {
      await updateProviderStatus(id, newStatus, reason);
      showToast(`Provider status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update provider status', 'error');
      throw err;
    }
  };

  const handleConnectionSubmit = async (
    providerId: string,
    payload: CreateConnectionPayload | UpdateConnectionPayload,
    connectionId?: string
  ) => {
    try {
      if (connectionId) {
        await updateConnection(providerId, connectionId, payload as UpdateConnectionPayload);
        showToast('Connection bind configuration updated');
      } else {
        await createConnection(providerId, payload as CreateConnectionPayload);
        showToast('New carrier connection bind established');
      }
      setIsAddConnectionOpen(false);
      setEditingConnectionTarget(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save connection', 'error');
      throw err;
    }
  };

  const handleToggleConnectionStatus = async (connectionId: string, currentStatus: string) => {
    if (!selectedProviderDetail) return;
    try {
      const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await updateConnectionStatus(selectedProviderDetail.id, connectionId, nextStatus as any);
      showToast(`Connection status changed to ${nextStatus}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle connection status', 'error');
      throw err;
    }
  };

  // If viewing details for /providers/:id
  if (selectedProviderId) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Operations', onClick: clearSelectedProvider },
              { label: 'Providers', onClick: clearSelectedProvider },
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

    if (selectedProviderDetail) {
      return (
        <>
          <ProviderDetailsView
            provider={selectedProviderDetail}
            onBack={clearSelectedProvider}
            onEdit={(p) => setEditingProvider(p)}
            onStatusChange={(p) => handleOpenStatusModal(p)}
            onAddConnection={() => {
              setEditingConnectionTarget(null);
              setIsAddConnectionOpen(true);
            }}
            onEditConnection={(_p, conn) => {
              setEditingConnectionTarget(conn);
              setIsAddConnectionOpen(true);
            }}
            onInspectConnection={(_p, conn) => {
              setInspectingConnectionTarget(conn);
            }}
            onToggleConnectionStatus={handleToggleConnectionStatus}
            onTestConnectionPing={testConnection}
          />

          {/* Edit Modal */}
          <EditProviderModal
            isOpen={!!editingProvider}
            onClose={() => setEditingProvider(null)}
            provider={editingProvider}
            onSubmit={handleEditSubmit}
          />

          {/* Status Modal */}
          <ProviderStatusModal
            isOpen={!!statusTarget.provider}
            onClose={() => setStatusTarget({ provider: null, nextStatus: null })}
            provider={statusTarget.provider}
            targetStatus={statusTarget.nextStatus}
            onConfirm={handleStatusConfirm}
          />

          {/* Add / Edit Connection Modal */}
          <ManageConnectionModal
            isOpen={isAddConnectionOpen}
            onClose={() => {
              setIsAddConnectionOpen(false);
              setEditingConnectionTarget(null);
            }}
            provider={selectedProviderDetail}
            connectionToEdit={editingConnectionTarget}
            onSubmit={handleConnectionSubmit}
          />

          {/* Connection Details / Live Inspector Modal */}
          <ProviderConnectionDetailsModal
            isOpen={!!inspectingConnectionTarget}
            onClose={() => setInspectingConnectionTarget(null)}
            provider={selectedProviderDetail}
            connection={inspectingConnectionTarget}
            onTestConnection={testConnection}
          />
        </>
      );
    }

    // Invalid / missing provider ID route (e.g. /providers/invalid)
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Operations', onClick: clearSelectedProvider },
            { label: 'Providers', onClick: clearSelectedProvider },
            { label: 'Not Found' },
          ]}
        />
        <NotFoundState
          title="Carrier Provider Not Found"
          resourceName="Carrier Provider"
          resourceId={selectedProviderId}
          onBack={clearSelectedProvider}
        />
      </div>
    );
  }

  // Table Columns Definition
  const columns: ColumnDef<ProviderItem>[] = [
    {
      key: 'name',
      header: 'Carrier Provider',
      render: (provider) => {
        const initials = provider.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('');

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors">
                  {provider.name}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                  {provider.slug}
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                <span>{provider.organization || 'Global NOC'}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                  {provider.countriesCovered.length} {provider.countriesCovered.length === 1 ? 'country' : 'countries'}
                </span>
              </div>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'type',
      header: 'Provider Type',
      render: (provider) => (
        <Badge variant={getTypeBadgeVariant(provider.type)}>
          {provider.type.replace(/_/g, ' ')}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (provider) => (
        <Badge variant={getStatusBadgeVariant(provider.status)}>
          {provider.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'connections',
      header: 'Connections',
      render: (provider) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Cable className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
          <span className="font-semibold text-[var(--text-primary)]">
            {provider.connectionsCount}
          </span>
          <span className="text-[var(--text-muted)]">
            ({provider.healthyConnectionsCount} healthy)
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'health',
      header: 'Health State',
      render: (provider) => (
        <div className="flex items-center gap-2">
          <Badge variant={getHealthBadgeVariant(provider.healthState)}>
            {provider.healthState}
          </Badge>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'countries',
      header: 'Countries Covered',
      render: (provider) => (
        <div className="flex flex-wrap items-center gap-1 max-w-[180px]">
          {provider.countriesCovered.slice(0, 3).map((code) => (
            <span
              key={code}
              className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
            >
              {code}
            </span>
          ))}
          {provider.countriesCovered.length > 3 && (
            <span className="text-[10px] font-mono text-[var(--accent-blue)] px-1 py-0.5 font-medium">
              +{provider.countriesCovered.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'numbers',
      header: 'Numbers Assigned',
      render: (provider) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {formatNumber(provider.assignedNumbersCount)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'volume',
      header: 'Message Volume',
      render: (provider) => (
        <div>
          <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">
            {formatNumber(provider.totalMessages)} SMS
          </div>
          {provider.deliveryRate !== undefined && (
            <div className="text-[10px] font-mono text-[var(--accent-emerald)] mt-0.5">
              {formatPercent(provider.deliveryRate)} DLR
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      render: (provider) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {provider.lastActivityAt ? formatRelativeTime(provider.lastActivityAt) : 'Never'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (provider) => (
        <div className="flex items-center justify-end">
          <MoreActionsMenu
            ariaLabel={`Actions for ${provider.name}`}
            items={[
              {
                id: 'view',
                label: 'View Telemetry & Binds',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: () => selectProvider(provider.id),
              },
              {
                id: 'edit',
                label: 'Edit Metadata',
                icon: <Edit2 className="w-3.5 h-3.5" />,
                onClick: () => setEditingProvider(provider),
              },
              {
                id: 'connections',
                label: 'Manage Connections',
                icon: <Cable className="w-3.5 h-3.5" />,
                onClick: () => selectProvider(provider.id),
              },
              {
                id: 'status',
                label: provider.status === 'ACTIVE' ? 'Suspend Provider' : 'Activate Provider',
                icon: <Power className="w-3.5 h-3.5" />,
                isDangerous: provider.status === 'ACTIVE',
                confirmTitle: `Suspend Provider ${provider.name}`,
                confirmMessage: `Are you sure you want to suspend carrier ${provider.name}? Routing traffic across all active binds will fail over or halt.`,
                onClick: () => handleOpenStatusModal(provider),
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

      {/* Page Header Standard Pattern */}
      <PageHeader
        title="Carrier Providers"
        description="Enterprise interconnect directory, SMPP/HTTP connections, sanitized credential vaults, and real-time routing telemetry."
        breadcrumbs={[{ label: 'Telecom' }, { label: 'Providers' }]}
        primaryAction={{
          label: 'Register Provider',
          onClick: () => setIsCreateOpen(true),
          icon: <Plus className="w-3.5 h-3.5" />,
          id: 'btn-register-provider',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh Providers telemetry"
          >
            Refresh
          </Button>
        }
      />

      {/* KPI Cards Row (7 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {isLoading ? (
          <>
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
              title="Total Providers"
              value={formatNumber(kpis.totalProviders)}
              subtext="Interconnect directory"
              icon={<Radio className="w-5 h-5" />}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="Directory"
              badgeVariant="info"
            />
            <StatCard
              title="Active Providers"
              value={formatNumber(kpis.activeProviders)}
              subtext="Traffic routing enabled"
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Active"
              badgeVariant="success"
            />
            <StatCard
              title="Suspended"
              value={formatNumber(kpis.suspendedProviders)}
              subtext="Traffic routing paused"
              icon={<ShieldAlert className="w-5 h-5" />}
              iconBgColor="bg-[var(--accent-rose-dim)] text-[var(--accent-rose)]"
              badgeText={kpis.suspendedProviders > 0 ? 'Review' : 'Zero'}
              badgeVariant={kpis.suspendedProviders > 0 ? 'error' : 'neutral'}
            />
            <StatCard
              title="Total Connections"
              value={formatNumber(kpis.totalConnections)}
              subtext="SMPP / HTTP binds"
              icon={<Cable className="w-5 h-5" />}
              iconBgColor="bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]"
              badgeText="Binds"
              badgeVariant="purple"
            />
            <StatCard
              title="Healthy Connections"
              value={formatNumber(kpis.healthyConnections)}
              subtext="Passing socket heartbeat"
              icon={<Activity className="w-5 h-5" />}
              iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
              badgeText="Operational"
              badgeVariant="success"
            />
            <StatCard
              title="Assigned Numbers"
              value={formatNumber(kpis.totalAssignedNumbers)}
              subtext="Allocated DID inventory"
              icon={<Hash className="w-5 h-5" />}
              iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
              badgeText="Inventory"
              badgeVariant="info"
            />
            <StatCard
              title="Traffic Volume"
              value={formatNumber(kpis.currentTrafficVolume)}
              subtext="Aggregated SMS processed"
              icon={<Send className="w-5 h-5" />}
              iconBgColor="bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]"
              badgeText="Throughput"
              badgeVariant="purple"
            />
          </>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Search provider by name, code, or NOC contact..."
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
              { label: 'Inactive', value: 'INACTIVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
            ],
            onChange: (val) => updateFilter('status', val),
          },
          {
            key: 'type',
            label: 'Provider Type',
            value: filterState.type,
            options: [
              { label: 'All Types', value: 'ALL' },
              { label: 'Tier-1 Carrier', value: 'TIER_1_CARRIER' },
              { label: 'Direct SMPP', value: 'DIRECT_SMPP' },
              { label: 'Aggregator', value: 'AGGREGATOR' },
              { label: 'Cloud Gateway', value: 'CLOUD_GATEWAY' },
            ],
            onChange: (val) => updateFilter('type', val),
          },
          {
            key: 'healthState',
            label: 'Health State',
            value: filterState.healthState,
            options: [
              { label: 'All Health States', value: 'ALL' },
              { label: 'Healthy', value: 'HEALTHY' },
              { label: 'Degraded', value: 'DEGRADED' },
              { label: 'Down / Critical', value: 'DOWN' },
            ],
            onChange: (val) => updateFilter('healthState', val),
          },
          {
            key: 'country',
            label: 'Coverage',
            value: filterState.country,
            options: [
              { label: 'All Countries', value: 'ALL' },
              { label: 'United States (US)', value: 'US' },
              { label: 'United Kingdom (GB)', value: 'GB' },
              { label: 'Germany (DE)', value: 'DE' },
              { label: 'France (FR)', value: 'FR' },
              { label: 'Japan (JP)', value: 'JP' },
              { label: 'Singapore (SG)', value: 'SG' },
              { label: 'Australia (AU)', value: 'AU' },
              { label: 'India (IN)', value: 'IN' },
              { label: 'Brazil (BR)', value: 'BR' },
            ],
            onChange: (val) => updateFilter('country', val),
          },
          {
            key: 'sortBy',
            label: 'Sort By',
            value: filterState.sortBy,
            options: [
              { label: 'Message Volume', value: 'volume' },
              { label: 'Provider Name', value: 'name' },
              { label: 'Registration Date', value: 'createdAt' },
              { label: 'Connection Count', value: 'connections' },
              { label: 'Assigned Numbers', value: 'numbers' },
              { label: 'Health Status', value: 'health' },
            ],
            onChange: (val) => updateFilter('sortBy', val as ProvidersSortField),
          },
        ]}
        onReset={resetFilters}
      />

      {/* Main Table / State View */}
      {error ? (
        <ErrorState
          title="Failed to Load Providers"
          message={error}
          onRetry={refresh}
        />
      ) : providers.length === 0 && !isLoading ? (
        <EmptyState
          title="No providers found"
          description="No carrier providers match your active search, category, or health filter criteria."
          icon={<Radio className="w-6 h-6" />}
          actionText="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={providers}
            keyExtractor={(p) => p.id}
            isLoading={isLoading}
            onRowClick={(p) => selectProvider(p.id)}
            emptyMessage="No providers available in directory"
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

      {/* Create Provider Modal */}
      <CreateProviderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit Provider Modal */}
      <EditProviderModal
        isOpen={!!editingProvider}
        onClose={() => setEditingProvider(null)}
        provider={editingProvider}
        onSubmit={handleEditSubmit}
      />

      {/* Status Modal */}
      <ProviderStatusModal
        isOpen={!!statusTarget.provider}
        onClose={() => setStatusTarget({ provider: null, nextStatus: null })}
        provider={statusTarget.provider}
        targetStatus={statusTarget.nextStatus}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
};
