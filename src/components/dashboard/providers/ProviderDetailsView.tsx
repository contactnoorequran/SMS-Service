/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Table, ColumnDef } from '../../ui/Table';
import {
  ProviderDetail,
  ProviderStatus,
  ProviderConnectionSummary,
} from '../../../types/providers';
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../../../utils/formatters';
import {
  ArrowLeft,
  Radio,
  Server,
  Activity,
  Shield,
  ShieldCheck,
  Globe,
  Clock,
  Zap,
  Edit2,
  Power,
  Plus,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Hash,
} from 'lucide-react';

interface ProviderDetailsViewProps {
  provider: ProviderDetail;
  onBack: () => void;
  onEdit: (provider: ProviderDetail) => void;
  onStatusChange: (provider: ProviderDetail) => void;
  onAddConnection: (provider: ProviderDetail) => void;
  onEditConnection: (provider: ProviderDetail, connection: ProviderConnectionSummary) => void;
  onInspectConnection: (provider: ProviderDetail, connection: ProviderConnectionSummary) => void;
  onToggleConnectionStatus: (connectionId: string, currentStatus: string) => Promise<void>;
  onTestConnectionPing: (
    providerId: string,
    connectionId: string
  ) => Promise<{ success: boolean; latencyMs: number; message: string; timestamp: string }>;
}

export const ProviderDetailsView: React.FC<ProviderDetailsViewProps> = ({
  provider,
  onBack,
  onEdit,
  onStatusChange,
  onAddConnection,
  onEditConnection,
  onInspectConnection,
  onToggleConnectionStatus,
  onTestConnectionPing,
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'traffic' | 'activity'>('connections');
  const [pingingConnId, setPingingConnId] = useState<string | null>(null);

  const getStatusBadgeVariant = (status: ProviderStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'neutral';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getConnectionStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'DISCONNECTED':
      case 'DISABLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const handlePingTest = async (connId: string) => {
    setPingingConnId(connId);
    try {
      await onTestConnectionPing(provider.id, connId);
    } finally {
      setPingingConnId(null);
    }
  };

  const connectionColumns: ColumnDef<ProviderConnectionSummary>[] = [
    {
      key: 'name',
      header: 'Connection Bind',
      render: (conn) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div
              onClick={() => onInspectConnection(provider, conn)}
              className="font-semibold text-xs text-[var(--text-primary)] hover:text-[var(--accent-blue)] cursor-pointer truncate"
            >
              {conn.name}
            </div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
              {conn.host}:{conn.port}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'protocol',
      header: 'Protocol / Environment',
      render: (conn) => (
        <div className="space-y-0.5">
          <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
            {conn.connectionType}
          </Badge>
          <div className="text-[10px] text-[var(--text-muted)]">
            {conn.environment} • Pri {conn.priority}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Socket State',
      render: (conn) => (
        <Badge variant={getConnectionStatusBadgeVariant(conn.status)} size="sm">
          {conn.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'credential',
      header: 'KMS Credential Reference',
      render: (conn) => (
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[var(--accent-emerald)] shrink-0" />
          <div className="min-w-0">
            <span className="font-mono text-xs text-[var(--text-primary)] truncate block">
              {conn.credential?.id || conn.credentialRefId || 'Vault Ref'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              KMS {conn.credential?.keyVersion || 'v1'} • Envelope TLS
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'latency',
      header: 'Ping Latency',
      render: (conn) => (
        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
          {conn.lastPingMs ? `${conn.lastPingMs} ms` : 'N/A'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (conn) => (
        <div className="flex items-center justify-end gap-1">
          {/* Diagnostic Ping */}
          <button
            onClick={() => handlePingTest(conn.id)}
            disabled={pingingConnId === conn.id}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-amber)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title="Diagnostic Ping"
            aria-label={`Diagnostic ping for ${conn.name}`}
          >
            <Zap className={`w-3.5 h-3.5 ${pingingConnId === conn.id ? 'animate-spin text-[var(--accent-amber)]' : ''}`} />
          </button>

          {/* Inspect Details */}
          <button
            onClick={() => onInspectConnection(provider, conn)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title="Inspect Connection Bind"
            aria-label={`Inspect ${conn.name}`}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEditConnection(provider, conn)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-blue)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title="Edit Connection Parameters"
            aria-label={`Edit ${conn.name}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Enable / Disable */}
          <button
            onClick={() => onToggleConnectionStatus(conn.id, conn.status)}
            className={`p-1.5 rounded-lg transition-colors ${
              conn.status === 'CONNECTED'
                ? 'text-[var(--text-secondary)] hover:text-[var(--accent-rose)] hover:bg-[var(--accent-rose-dim)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald-dim)]'
            }`}
            title={conn.status === 'CONNECTED' ? 'Disable Bind' : 'Enable Bind'}
            aria-label={`${conn.status === 'CONNECTED' ? 'Disable' : 'Enable'} ${conn.name}`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Operations', onClick: onBack },
              { label: 'Providers', onClick: onBack },
              { label: provider.name },
            ]}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Back to Providers directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              {provider.name}
            </h1>
            <Badge variant={getStatusBadgeVariant(provider.status)} size="md">
              {provider.status}
            </Badge>
            <Badge variant="purple" size="md">
              {provider.type}
            </Badge>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onAddConnection(provider)}>
            <Plus className="w-3.5 h-3.5 mr-1.5 text-[var(--accent-blue)]" />
            Add Connection Bind
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(provider)}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Provider
          </Button>
          <Button
            variant={provider.status === 'ACTIVE' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => onStatusChange(provider)}
          >
            <Power className="w-3.5 h-3.5 mr-1.5" />
            {provider.status === 'ACTIVE' ? 'Suspend Trunk' : 'Activate Trunk'}
          </Button>
        </div>
      </div>

      {/* Two-Column Master / Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3 width): Profile, Health, Rates, Coverage */}
        <div className="space-y-6">
          {/* Provider Profile Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-blue-dim)] border border-[var(--border-subtle)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-base shadow-[0_0_20px_var(--accent-blue-dim)]">
                <Radio className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
                  {provider.name}
                </h2>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {provider.slug}
                </span>
              </div>
            </div>

            {provider.description && (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {provider.description}
              </p>
            )}

            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Provider ID</span>
                <span className="font-mono text-[var(--text-primary)]">{provider.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Trunk Architecture</span>
                <span className="font-semibold text-[var(--text-primary)]">{provider.type}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Active Interconnects</span>
                <span className="font-mono text-[var(--text-primary)] font-semibold">
                  {provider.healthyConnectionsCount} of {provider.connectionsCount} Binds
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Established Date</span>
                <span className="font-mono text-[var(--text-primary)]">{formatDate(provider.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Last Telemetry Check</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {provider.lastActivityAt ? formatRelativeTime(provider.lastActivityAt) : 'Recent'}
                </span>
              </div>
            </div>

            {/* NOC Contacts */}
            {(provider.technicalContact || provider.nocEmail) && (
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                  Carrier NOC Escort
                </span>
                {provider.technicalContact && (
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{provider.technicalContact}</span>
                  </div>
                )}
                {provider.nocEmail && (
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{provider.nocEmail}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Connection Health & Watchdog Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Connection Health & SLA
              </h3>
              <Badge variant={provider.healthState === 'HEALTHY' ? 'success' : 'error'} size="sm">
                {provider.health?.healthScore ?? 99}% Score
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span className="text-[var(--text-secondary)]">90-Day Uptime SLA:</span>
                  <span className="font-bold text-[var(--accent-emerald)]">{provider.health?.uptime90d ?? 99.9}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--bg-glass-card)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="h-full bg-[var(--accent-emerald)] rounded-full"
                    style={{ width: `${provider.health?.uptime90d ?? 99.9}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)]">Average Latency:</span>
                  <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
                    {provider.health?.avgLatencyMs ?? 42} ms
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[var(--text-muted)]">Active Binds:</span>
                  <div className="font-mono text-sm font-bold text-[var(--accent-blue)]">
                    {provider.healthyConnectionsCount} / {provider.connectionsCount}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Wholesale Rates & Commercial Telemetry */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Wholesale Interconnect Rates
              </h3>
              <Badge variant="info" size="sm">
                Active Tier
              </Badge>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-[var(--text-secondary)]">Wholesale Starting Cost</span>
              <div className="text-2xl font-extrabold text-[var(--accent-emerald)] font-mono">
                {formatCurrency(provider.rates?.startingRate ?? 0.0045, 'USD', true)}
                <span className="text-xs text-[var(--text-muted)] font-normal ml-1.5">/ SMS segment</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] pt-1">
                {provider.rates?.rateCount ?? 120} carrier destination prefixes configured
              </div>
            </div>
          </Card>

          {/* Country Coverage Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Coverage Footprint
              </h3>
              <Badge variant="purple" size="sm">
                {provider.coverage?.countriesCount ?? provider?.countriesCovered?.length ?? 0} Countries
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(provider?.countriesCovered) && provider.countriesCovered.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-md bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-primary)]"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Assigned Numbers Hosted:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {provider.assignedNumbersCount} E.164
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (2/3 width): Telemetry, Connection Binds, Traffic, Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Total Volume
              </span>
              <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
                {formatNumber(provider.totalMessages)}
              </div>
              <span className="text-[10px] text-[var(--accent-blue)]">Dispatched Messages</span>
            </div>

            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Delivery Ratio
              </span>
              <div className="text-lg font-bold text-[var(--accent-emerald)] font-mono mt-0.5">
                {formatPercent(provider.deliveryRate)}
              </div>
              <span className="text-[10px] text-[var(--accent-emerald)]">DLR Receipted</span>
            </div>

            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Throughput Cap
              </span>
              <div className="text-lg font-bold text-[var(--accent-purple)] font-mono mt-0.5">
                {provider.traffic?.throughputTps ?? 200} TPS
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">Rate-Limit Window</span>
            </div>

            <div className="p-3.5 bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] rounded-xl">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
                Active Binds
              </span>
              <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-0.5">
                {provider.healthyConnectionsCount} Binds
              </div>
              <span className="text-[10px] text-[var(--accent-emerald)]">Online Sockets</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'connections'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-card)]'
              }`}
            >
              Connection Binds ({provider.connections?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('traffic')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'traffic'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-card)]'
              }`}
            >
              Traffic & Operational Telemetry
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'activity'
                  ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-card)]'
              }`}
            >
              Activity History ({provider.recentActivity?.length || 0})
            </button>
          </div>

          {/* TAB 1: CONNECTION BINDS */}
          {activeTab === 'connections' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Carrier Protocol Interconnects & Sockets
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Dual SMPP binds and HTTP/REST Webhook pipelines configured with KMS credential references
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onAddConnection(provider)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Bind
                </Button>
              </div>

              <Table
                columns={connectionColumns}
                data={provider.connections}
                keyExtractor={(c) => c.id}
                emptyMessage="No connection binds configured on this provider."
              />
            </Card>
          )}

          {/* TAB 2: TRAFFIC TELEMETRY */}
          {activeTab === 'traffic' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Live Carrier Traffic Breakdown
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Cumulative messaging delivery telemetry and failed DLR statistics
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  Telemetry Stream
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)]">Outbound Dispatched:</span>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                    {formatNumber(provider.traffic?.outboundMessages ?? 0)}
                  </div>
                  <span className="text-[10px] text-[var(--accent-blue)]">Sent to MNOs</span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)]">Inbound Ingress:</span>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                    {formatNumber(provider.traffic?.inboundMessages ?? 0)}
                  </div>
                  <span className="text-[10px] text-[var(--accent-purple)]">MO Received</span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[11px] text-[var(--text-muted)]">Delivery Failures:</span>
                  <div className="text-xl font-mono font-bold text-[var(--accent-rose)]">
                    {formatNumber(provider.traffic?.failedMessages ?? 0)}
                  </div>
                  <span className="text-[10px] text-[var(--accent-rose)]">Undelivered / Bounced</span>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: ACTIVITY FEED */}
          {activeTab === 'activity' && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Carrier Gateway Audit Feed
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Socket state changes, automated latency checks, and KMS credential rotations
                  </p>
                </div>
              </div>

              {provider.recentActivity && provider.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {provider.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[var(--bg-glass-card)] border border-[var(--border-subtle)] text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {item.action.replace('_', ' ')}
                          </span>
                          {item.actor && (
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">
                              by {item.actor}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-secondary)] text-[11px]">{item.description}</p>
                      </div>

                      <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No security audit history recorded.
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
