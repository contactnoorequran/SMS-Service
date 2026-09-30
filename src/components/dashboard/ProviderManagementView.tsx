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
  CreateProviderPayload,
  UpdateProviderPayload,
  CreateConnectionPayload,
  UpdateConnectionPayload,
  ProviderConnectionSummary,
} from '../../types/providers';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, ColumnDef } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { StatCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { CountryFlag } from '../ui/CountryFlag';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { NotFoundState } from '../system/NotFoundState';
import { MoreActionsMenu } from '../ui/MoreActionsMenu';
import { Modal } from '../ui/Modal';

import { CreateProviderModal } from './providers/CreateProviderModal';
import { EditProviderModal } from './providers/EditProviderModal';
import { ProviderStatusModal } from './providers/ProviderStatusModal';
import { ManageConnectionModal } from './providers/ManageConnectionModal';
import { ProviderConnectionDetailsModal } from './providers/ProviderConnectionDetailsModal';
import { ProviderDetailsView } from './providers/ProviderDetailsView';

import {
  formatDate,
  formatNumber,
  formatRelativeTime,
} from '../../utils/formatters';
import {
  Radio,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Hash,
  Globe,
  RefreshCw,
  Plus,
  Eye,
  Edit2,
  Power,
  Cable,
  Send,
  Search,
  Filter,
  Layers,
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

  // Quick Info inspection modal (Coverage / Binds)
  const [quickModalTarget, setQuickModalTarget] = useState<{
    type: 'binds' | 'coverage';
    provider: ProviderItem;
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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
        return 'info';
      case 'DIRECT_SMPP':
        return 'success';
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
        showToast('Carrier connection configuration saved');
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
              { id: 'telecom', label: 'Telecom', onClick: clearSelectedProvider },
              { id: 'providers', label: 'Providers', onClick: clearSelectedProvider },
              { id: 'loading', label: 'Loading telemetry...' },
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
            onEdit={() => setEditingProvider(selectedProviderDetail)}
            onStatusChange={() => handleOpenStatusModal(selectedProviderDetail)}
            onAddConnection={() => {
              setEditingConnectionTarget(null);
              setIsAddConnectionOpen(true);
            }}
            onEditConnection={(_provider, conn) => {
              setEditingConnectionTarget(conn);
              setIsAddConnectionOpen(true);
            }}
            onToggleConnectionStatus={(connId, currStatus) =>
              handleToggleConnectionStatus(connId, currStatus)
            }
            onInspectConnection={(_provider, conn) => setInspectingConnectionTarget(conn)}
            onTestConnectionPing={(providerId, connId) => testConnection(providerId, connId)}
          />

          <EditProviderModal
            isOpen={!!editingProvider}
            onClose={() => setEditingProvider(null)}
            provider={editingProvider}
            onSubmit={handleEditSubmit}
          />

          <ProviderStatusModal
            isOpen={!!statusTarget.provider}
            onClose={() => setStatusTarget({ provider: null, nextStatus: null })}
            provider={statusTarget.provider}
            targetStatus={statusTarget.nextStatus}
            onConfirm={handleStatusConfirm}
          />

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

    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { id: 'telecom', label: 'Telecom', onClick: clearSelectedProvider },
            { id: 'providers', label: 'Providers', onClick: clearSelectedProvider },
            { id: 'not-found', label: 'Not Found' },
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

  // Country metadata mapping
  const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
    US: { name: 'United States', flag: '🇺🇸' },
    GB: { name: 'United Kingdom', flag: '🇬🇧' },
    DE: { name: 'Germany', flag: '🇩🇪' },
    FR: { name: 'France', flag: '🇫🇷' },
    JP: { name: 'Japan', flag: '🇯🇵' },
    SG: { name: 'Singapore', flag: '🇸🇬' },
    AU: { name: 'Australia', flag: '🇦🇺' },
    IN: { name: 'India', flag: '🇮🇳' },
    BR: { name: 'Brazil', flag: '🇧🇷' },
    CA: { name: 'Canada', flag: '🇨🇦' },
    ES: { name: 'Spain', flag: '🇪🇸' },
    IT: { name: 'Italy', flag: '🇮🇹' },
    NL: { name: 'Netherlands', flag: '🇳🇱' },
    AE: { name: 'United Arab Emirates', flag: '🇦🇪' },
    SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
    PK: { name: 'Pakistan', flag: '🇵🇰' },
  };

  // Table Columns Definition matching Screenshot 1
  const columns: ColumnDef<ProviderItem>[] = [
    {
      key: 'name',
      header: 'PROVIDER',
      className: 'w-[240px]',
      render: (provider) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            selectProvider(provider.id);
          }}
          className="font-medium text-xs text-[var(--text-primary)] hover:text-teal-400 transition-colors cursor-pointer"
        >
          {provider.name}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'protocol',
      header: 'PROTOCOL',
      className: 'w-[120px]',
      render: (provider) => {
        const isSmpp =
          provider.type === 'DIRECT_SMPP' ||
          provider.name.toLowerCase().includes('smpp') ||
          (provider.connections || []).some((c) => c.connectionType === 'SMPP_TRANSCEIVER');
        return isSmpp ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            SMPP
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            HTTP API
          </span>
        );
      },
      sortable: true,
    },
    {
      key: 'okSms',
      header: 'OK SMS',
      className: 'w-[110px]',
      render: (provider) => (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40">
          {provider.totalMessages || 0}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'fieldSms',
      header: 'FIELD SMS',
      className: 'w-[110px]',
      render: () => (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40">
          0
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'w-[90px] text-right',
      render: (provider) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingProvider(provider);
            }}
            className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] hover:text-teal-400 transition-colors"
            title="Edit Provider"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
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
                label: 'Edit Configuration',
                icon: <Edit2 className="w-3.5 h-3.5" />,
                onClick: () => setEditingProvider(provider),
              },
              {
                id: 'status',
                label: provider.status === 'ACTIVE' ? 'Suspend Carrier' : 'Activate Carrier',
                icon: <Power className="w-3.5 h-3.5" />,
                isDangerous: provider.status === 'ACTIVE',
                onClick: () => handleOpenStatusModal(provider),
              },
            ]}
          />
        </div>
      ),
    },
  ];


  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]'
              : 'bg-[var(--accent-rose-dim)] border-[rgba(244,63,94,0.3)] text-[var(--accent-rose)]'
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

      {/* 1. Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Providers
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Manage HTTP and SMPP providers, connection status, inbound webhooks, and diagnostics.
          </p>
          <div className="pt-0.5">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
              ADMIN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Provider</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. Top 2 KPI Cards matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              TOTAL PROVIDERS
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              {kpis.totalProviders || providers.length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {kpis.activeProviders || providers.filter((p) => p.status === 'ACTIVE').length} active
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              HTTP PROVIDERS
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              {providers.filter((p) => p.type === 'CLOUD_GATEWAY' || p.name.toLowerCase().includes('http')).length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              API / webhook integrations
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filters Section matching Screenshot 1 */}
      <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] space-y-3">
        <div>
          <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Filters
          </h2>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Search by name, host, or system ID
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search: Name, host, system ID..."
              value={filterState.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterState.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">Connection: All connections</option>
              <option value="DIRECT_SMPP">SMPP</option>
              <option value="CLOUD_GATEWAY">HTTP API</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={filterState.limit}
              onChange={(e) => updateFilter('limit', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="10">Rows: 10</option>
              <option value="25">Rows: 25</option>
              <option value="50">Rows: 50</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table Header matching Screenshot 1 */}
      <div className="pt-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          Providers Inventory
        </h2>
        <p className="text-[11px] text-[var(--text-tertiary)]">
          {providers.length} providers in current view
        </p>
      </div>

      {/* 4. Main Carriers Table */}
      {error ? (
        <ErrorState
          title="Failed to Load Providers"
          message={error}
          onRetry={refresh}
        />
      ) : providers.length === 0 && !isLoading ? (
        <EmptyState
          title="No providers found"
          description="No carrier providers match your active search or filter criteria."
          iconName="provider"
          actionText="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-[var(--glass-border)] overflow-hidden">
          <Table
            columns={columns}
            data={providers}
            keyExtractor={(p) => p.id}
            isLoading={isLoading}
            onRowClick={(p) => selectProvider(p.id)}
            emptyMessage="No carrier gateways configured"
          />

          {totalCount > filterState.limit && (
            <div className="p-3 border-t border-[var(--glass-border)] bg-[var(--input-bg-subtle)]">
              <Pagination
                currentPage={filterState.page}
                totalPages={totalPages}
                onPageChange={(page) => updateFilter('page', page)}
                pageSize={filterState.limit}
                totalItems={totalCount}
              />
            </div>
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

      {/* Quick Binds / Coverage Inspection Modal */}
      {quickModalTarget && (
        <Modal
          isOpen={!!quickModalTarget}
          onClose={() => setQuickModalTarget(null)}
          title={
            quickModalTarget.type === 'binds'
              ? `${quickModalTarget.provider.name} • Connection Sockets`
              : `${quickModalTarget.provider.name} • Destination Coverage`
          }
          maxWidth="md"
        >
          {quickModalTarget.type === 'binds' ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Carrier Trunk: {quickModalTarget.provider.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {quickModalTarget.provider.connectionsCount} Configured Binds • {quickModalTarget.provider.healthyConnectionsCount} Passing Heartbeat
                  </div>
                </div>
                <Badge variant={getHealthBadgeVariant(quickModalTarget.provider.healthState)} size="sm">
                  {quickModalTarget.provider.healthState}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--text-secondary)]">
                  Active Interconnect Binds:
                </div>
                {(quickModalTarget.provider.connections || []).map((connection) => (
                  <div
                    key={connection.id}
                    className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Cable className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {connection.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {connection.connectionType}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--accent-emerald)] font-bold bg-[var(--accent-emerald-dim)] px-2 py-0.5 rounded border border-[rgba(16,185,129,0.2)]">
                      {connection.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--glass-border)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickModalTarget(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const id = quickModalTarget.provider.id;
                    setQuickModalTarget(null);
                    selectProvider(id);
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Open Full Carrier Telemetry
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {quickModalTarget.provider.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {quickModalTarget.provider.countriesCovered.length} Covered Destination Countries
                  </div>
                </div>
                <Badge variant="info" size="sm">
                  Global MNO Routing
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {quickModalTarget.provider.countriesCovered.map((code) => {
                  const info = COUNTRY_INFO[code] || { name: code, flag: '🌐' };
                  return (
                    <div
                      key={code}
                      className="p-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center gap-2"
                    >
                      <CountryFlag flag={info.flag} countryName={info.name} size="sm" className="text-base shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {info.name}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                          ISO: {code}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--glass-border)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickModalTarget(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const id = quickModalTarget.provider.id;
                    setQuickModalTarget(null);
                    selectProvider(id);
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Open Full Carrier Telemetry
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
