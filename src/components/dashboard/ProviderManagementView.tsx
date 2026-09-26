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
            onToggleStatus={() => handleOpenStatusModal(selectedProviderDetail)}
            onAddConnection={() => {
              setEditingConnectionTarget(null);
              setIsAddConnectionOpen(true);
            }}
            onEditConnection={(conn) => {
              setEditingConnectionTarget(conn);
              setIsAddConnectionOpen(true);
            }}
            onToggleConnectionStatus={(connId, currStatus) =>
              handleToggleConnectionStatus(connId, currStatus)
            }
            onInspectConnection={(conn) => setInspectingConnectionTarget(conn)}
            onTestConnection={(connId) => testConnection(selectedProviderDetail.id, connId)}
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

  // Table Columns Definition
  const columns: ColumnDef<ProviderItem>[] = [
    {
      key: 'name',
      header: 'Carrier Provider',
      className: 'w-[260px]',
      render: (provider) => {
        const initials = provider.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('');

        return (
          <div className="flex items-center gap-2.5 max-w-[260px]">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.25)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    selectProvider(provider.id);
                  }}
                  title={provider.description || provider.name}
                  className="font-semibold text-xs text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors truncate cursor-pointer"
                >
                  {provider.name}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-tertiary)] bg-[rgba(0,0,0,0.25)] px-1 py-0.2 rounded border border-[var(--glass-border)] shrink-0">
                  {provider.slug}
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
      header: 'Type',
      className: 'w-[110px]',
      render: (provider) => {
        const typeMap: Record<string, string> = {
          TIER_1_CARRIER: 'Tier-1',
          DIRECT_SMPP: 'Direct SMPP',
          CLOUD_GATEWAY: 'Cloud Gateway',
          AGGREGATOR: 'Aggregator',
        };
        return (
          <Badge variant={getTypeBadgeVariant(provider.type)} size="sm">
            {typeMap[provider.type] || provider.type}
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[85px]',
      render: (provider) => (
        <Badge variant={getStatusBadgeVariant(provider.status)} size="sm">
          {provider.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'connections',
      header: 'Binds',
      className: 'w-[115px]',
      render: (provider) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQuickModalTarget({ type: 'binds', provider });
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[rgba(59,130,246,0.08)] hover:bg-[rgba(59,130,246,0.2)] text-[var(--accent-blue)] border border-[rgba(59,130,246,0.25)] transition-all cursor-pointer font-mono text-xs whitespace-nowrap shadow-xs"
          title="Click to view connection bind telemetry"
        >
          <Cable className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold text-[var(--text-primary)]">
            {provider.connectionsCount}
          </span>
          <span className="text-[10px] text-[var(--accent-emerald)] font-semibold shrink-0">
            ({provider.healthyConnectionsCount} ok)
          </span>
        </button>
      ),
      sortable: true,
    },
    {
      key: 'health',
      header: 'Health',
      className: 'w-[90px]',
      render: (provider) => (
        <Badge variant={getHealthBadgeVariant(provider.healthState)} size="sm">
          {provider.healthState}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'countries',
      header: 'Coverage',
      className: 'w-[125px]',
      render: (provider) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQuickModalTarget({ type: 'coverage', provider });
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[rgba(0,0,0,0.25)] hover:bg-[rgba(59,130,246,0.15)] border border-[var(--glass-border)] hover:border-[rgba(59,130,246,0.3)] transition-all cursor-pointer whitespace-nowrap text-xs shadow-xs"
          title="Click to view destination coverage"
        >
          <Globe className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
          <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--text-secondary)] shrink-0">
            {provider.countriesCovered.slice(0, 2).map((code) => (
              <span
                key={code}
                className="text-[10px] px-1 py-0.2 rounded bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)]"
              >
                {code}
              </span>
            ))}
            {provider.countriesCovered.length > 2 && (
              <span className="text-[10px] text-[var(--accent-blue)] font-bold">
                +{provider.countriesCovered.length - 2}
              </span>
            )}
          </div>
        </button>
      ),
    },
    {
      key: 'numbers',
      header: 'DIDs',
      className: 'w-[80px]',
      render: (provider) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {formatNumber(provider.assignedNumbersCount)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'volume',
      header: 'SMS Volume',
      className: 'w-[100px]',
      render: (provider) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {formatNumber(provider.totalMessages)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[40px] text-right',
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

      {/* 1. Sleek Compact Header */}
      <div className="p-5 glass-card border-[rgba(59,130,246,0.15)] relative overflow-hidden rounded-2xl">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                <Radio className="w-3.5 h-3.5 mr-1" />
                Carrier Gateway Core
              </Badge>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                SMS Service Telecom Routing
              </span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Carrier Providers & SMPP Interconnects
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Direct MNO interconnects, SMPP v3.4 sockets, and carrier failover routing trunks.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Carrier</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Compact 4-Card Telemetry Row (Replaced 7 bulky cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              Total Gateways
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              {kpis.totalProviders}
            </div>
            <div className="text-[11px] text-[var(--accent-emerald)] font-medium mt-0.5">
              {kpis.activeProviders} Routing Active
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              Active Interconnect Binds
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--accent-emerald)] mt-1">
              {kpis.healthyConnections} / {kpis.totalConnections}
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              Passing Heartbeat
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)] flex items-center justify-center">
            <Cable className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              Assigned Numbers
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
              {formatNumber(kpis.totalAssignedNumbers)}
            </div>
            <div className="text-[11px] text-[var(--accent-blue)] mt-0.5">
              Active DID Inventory
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] text-[var(--accent-blue)] flex items-center justify-center">
            <Hash className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
              Carrier Throughput
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
              {formatNumber(kpis.currentTrafficVolume)}
            </div>
            <div className="text-[11px] text-[var(--accent-emerald)] mt-0.5">
              SMS Processed
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Streamlined 1-Line Filter & Search Bar */}
      <div className="glass-card p-3 rounded-xl border border-[var(--glass-border)] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 text-xs flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search provider, code, or country..."
            value={filterState.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </div>

        {/* Quick Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0 shrink-0">
          {[
            { id: 'ALL', label: 'All Types' },
            { id: 'TIER_1_CARRIER', label: 'Tier-1' },
            { id: 'DIRECT_SMPP', label: 'SMPP' },
            { id: 'CLOUD_GATEWAY', label: 'Cloud' },
            { id: 'AGGREGATOR', label: 'Aggregator' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateFilter('type', tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterState.type === tab.id
                  ? 'bg-[var(--accent-blue)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown & Reset */}
        <div className="flex items-center gap-2">
          <select
            value={filterState.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[rgba(0,0,0,0.2)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>

          {(filterState.search || filterState.type !== 'ALL' || filterState.status !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
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
          icon={<Radio className="w-6 h-6" />}
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
            <div className="p-3 border-t border-[var(--glass-border)] bg-[rgba(0,0,0,0.1)]">
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
                {Array.from({ length: quickModalTarget.provider.connectionsCount || 1 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Cable className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                      <span className="font-semibold text-[var(--text-primary)]">
                        {quickModalTarget.provider.slug}-bind-0{idx + 1}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        SMPP v3.4 (TRX) :2775
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--accent-emerald)] font-bold bg-[var(--accent-emerald-dim)] px-2 py-0.5 rounded border border-[rgba(16,185,129,0.2)]">
                      CONNECTED
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
                      <span className="text-base shrink-0">{info.flag}</span>
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
