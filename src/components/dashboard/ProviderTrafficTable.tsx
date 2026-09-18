import React, { useState } from 'react';
import { ProviderTrafficItem } from '../../types/dashboard';
import { Radio, Activity, CheckCircle2, AlertTriangle, Hash, Zap } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Table, ColumnDef } from '../ui/Table';
import { formatNumber } from '../../utils/formatters';

interface ProviderTrafficTableProps {
  providers: ProviderTrafficItem[];
  isLoading?: boolean;
  onSelectProvider?: (provider: ProviderTrafficItem) => void;
}

export const ProviderTrafficTable: React.FC<ProviderTrafficTableProps> = ({
  providers,
  isLoading = false,
  onSelectProvider,
}) => {
  const [sortKey, setSortKey] = useState<string>('totalMessages');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedProviders = [...providers].sort((a, b) => {
    const aVal = a[sortKey as keyof ProviderTrafficItem] ?? 0;
    const bVal = b[sortKey as keyof ProviderTrafficItem] ?? 0;
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const columns: ColumnDef<ProviderTrafficItem>[] = [
    {
      key: 'name',
      header: 'Provider',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-[190px]">
          <div className="p-2 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[var(--text-primary)] truncate">
              {item.name}
            </div>
            <div className="text-[11px] font-mono text-[var(--text-tertiary)] truncate">
              {item.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'protocol',
      header: 'Protocol',
      sortable: true,
      render: (item) => (
        <Badge variant="neutral" size="sm" className="font-mono text-[11px]">
          {item.protocol}
        </Badge>
      ),
    },
    {
      key: 'avgLatencyMs',
      header: 'Connection',
      sortable: true,
      render: (item) => {
        const isHealthy = item.status === 'ACTIVE';
        return (
          <div className="flex items-center gap-1.5 min-w-[110px]">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isHealthy
                  ? 'bg-[var(--accent-emerald)] animate-pulse-dot'
                  : 'bg-[var(--accent-amber)]'
              }`}
            />
            <span className="font-mono text-xs text-[var(--text-secondary)]">
              {isHealthy ? `${item.avgLatencyMs}ms` : 'Degraded'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'totalMessages',
      header: 'Messages',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="font-mono font-semibold text-[var(--text-primary)] text-right">
          {formatNumber(item.totalMessages)}
        </div>
      ),
    },
    {
      key: 'numbersCount',
      header: 'Numbers',
      sortable: true,
      className: 'text-right',
      render: (item) => {
        const count = item.numbersCount ?? (item.slug.includes('global') ? 2 : 1);
        return (
          <div className="flex items-center justify-end gap-1 font-mono text-xs text-[var(--text-secondary)]">
            <Hash className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span>{formatNumber(count)}</span>
          </div>
        );
      },
    },
    {
      key: 'throughputTps',
      header: 'Throughput',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1 font-mono text-xs text-[var(--text-secondary)]">
          <Zap className="w-3 h-3 text-[var(--accent-amber)]" />
          <span>{item.throughputTps} TPS</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'text-center',
      render: (item) => {
        const isActive = item.status === 'ACTIVE';
        return (
          <Badge variant={isActive ? 'success' : 'warning'} size="sm">
            {isActive ? (
              <CheckCircle2 className="w-3 h-3 mr-1 inline" />
            ) : (
              <AlertTriangle className="w-3 h-3 mr-1 inline" />
            )}
            <span>{item.status}</span>
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Provider Traffic & Operations
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time multi-carrier gateway connections, throughput caps, and message delivery health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            {providers.length} Connected {providers.length === 1 ? 'Gateway' : 'Gateways'}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Table<ProviderTrafficItem>
          columns={columns}
          data={sortedProviders}
          keyExtractor={(item) => item.id}
          sortKey={sortKey}
          sortDirection={sortDir}
          onSort={handleSort}
          isLoading={isLoading}
          emptyMessage="No Provider Gateways Found"
          emptySubtext="No SMS carrier connections or HTTP/SMPP trunks have been configured yet."
          onRowClick={onSelectProvider}
        />
      </div>
    </div>
  );
};
