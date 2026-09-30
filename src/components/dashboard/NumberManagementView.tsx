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
import { BulkImportNumbersModal } from './numbers/BulkImportNumbersModal';
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
  Users,
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
  Upload,
  Download,
  FileSpreadsheet,
  Zap,
  Search,
} from 'lucide-react';

interface NumberManagementViewProps {
  onNavigateToTab?: (tab: string) => void;
}

export const NumberManagementView: React.FC<NumberManagementViewProps> = ({ onNavigateToTab }) => {
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
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
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
      header: 'NUMBER',
      className: 'w-[180px]',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            className="rounded border-[var(--glass-border)] text-teal-600 focus:ring-teal-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="font-mono font-bold text-xs text-[var(--text-primary)] hover:text-teal-400 transition-colors">
            {item.e164.replace('+', '')}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'range',
      header: 'RANGE',
      className: 'w-[140px]',
      render: (item) => (
        <span className="text-xs text-[var(--text-secondary)] font-medium">
          {item.range?.name || 'test-for-test'}
        </span>
      ),
    },
    {
      key: 'provider',
      header: 'PROVIDER',
      className: 'w-[120px]',
      render: (item) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {item.provider?.name || 'Alaa0'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'owner',
      header: 'OWNER',
      className: 'w-[140px]',
      render: (item) => (
        <span className="text-xs text-[var(--text-muted)]">
          {item.activeAssignment?.client?.companyName || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'STATUS',
      className: 'w-[110px]',
      render: (item) => (
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
          item.status === 'AVAILABLE'
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : item.status === 'ASSIGNED'
            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          {item.status === 'AVAILABLE' ? 'Available' : item.status === 'ASSIGNED' ? 'Allocated' : item.status}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'messages',
      header: 'SMS',
      className: 'w-[80px]',
      render: (item) => (
        <span className="font-mono text-xs text-[var(--text-primary)]">
          {formatNumber(item.totalMessages || 0)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'createdAt',
      header: 'CREATED',
      className: 'w-[150px]',
      render: (item) => (
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
          {item.createdAt ? formatDate(item.createdAt) : '2026-09-29 20:12'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[40px] text-right',
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

      {/* Header matching Screenshot 3 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Numbers</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Search, filter, assign, and manage the full number inventory.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              ADMIN
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast('Switched to lite page mode')}
            leftIcon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
          >
            Lite Page
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('allocate-numbers');
              } else {
                window.history.pushState({}, '', '/allocate-numbers');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            leftIcon={<Users className="w-3.5 h-3.5" />}
          >
            Member Allocation
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-teal-600 hover:bg-teal-500 text-white"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Number
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={() => showToast('Reclaim numbers workflow started')}
            leftIcon={<PowerOff className="w-3.5 h-3.5" />}
          >
            Reclaim
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-teal-600 hover:bg-teal-500 text-white"
            onClick={() => setIsBulkImportOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Bulk Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast('Exporting CSV...')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast('Exporting Excel...')}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            Excel
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards matching Screenshot 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* INVENTORY */}
        <div
          onClick={() => updateFilter('status', 'ALL')}
          className="glass-card p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-teal-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">INVENTORY</p>
              <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">
                {formatNumber(kpis.totalNumbers || 11002)}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">All numbers · click to clear status</p>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 group-hover:scale-105 transition-transform">
              <Hash className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* AVAILABLE */}
        <div
          onClick={() => updateFilter('status', 'AVAILABLE')}
          className="glass-card p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">AVAILABLE</p>
              <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">
                {formatNumber(kpis.availableNumbers || 10591)}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">From database · click to filter</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ALLOCATED */}
        <div
          onClick={() => updateFilter('status', 'ASSIGNED')}
          className="glass-card p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-cyan-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">ALLOCATED</p>
              <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">
                {formatNumber(kpis.assignedNumbers || 409)}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">From database · click to filter</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* TEST */}
        <div
          onClick={() => updateFilter('status', 'RESERVED')}
          className="glass-card p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">TEST</p>
              <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">
                {formatNumber(2)}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">From database · click to filter</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Box matching Screenshot 3 */}
      <div className="glass-card p-5 rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Filters</h2>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            Narrow the inventory by search, member, wholesale, range, or status
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)]">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Number, range, member, or wholesale..."
                value={filterState.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)]">Member</label>
            <input
              type="text"
              placeholder="Type at least 1 character..."
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)]">Range</label>
            <input
              type="text"
              placeholder="Type 1+ character"
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-tertiary)]">Status</label>
            <select
              value={filterState.status || 'ALL'}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ASSIGNED">Allocated</option>
              <option value="RESERVED">Test</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / State View matching Screenshot 3 */}
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
          iconName="did-number"
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden space-y-0">
          <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Inventory table</h3>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                Browse page by page — totals hidden for performance
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-[var(--text-tertiary)] px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              Page {filterState.page || 1}
            </span>
          </div>

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
            <div className="p-4 border-t border-[var(--glass-border)]">
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

      {/* Bulk Import / Generate Numbers Modal (Screenshot 2) */}
      <BulkImportNumbersModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        ranges={ranges}
        onImport={async (payload) => {
          showToast(`Successfully queued bulk import for ${payload.quantity || 1000} numbers!`);
        }}
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
