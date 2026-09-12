import React, { useState } from 'react';
import { ProviderTrafficItem } from '../../types/dashboard';
import { Radio, ArrowUpRight, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Table, ColumnDef } from '../ui/Table';

interface ProviderTrafficTableProps {
  providers: ProviderTrafficItem[];
  onSelectProvider?: (provider: ProviderTrafficItem) => void;
}

export const ProviderTrafficTable: React.FC<ProviderTrafficTableProps> = ({
  providers,
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

  const sortedProviders = [...providers].sort((a: any, b: any) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const columns: ColumnDef<ProviderTrafficItem>[] = [
    {
      key: 'name',
      header: 'Provider / Carrier Gateway',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
              <span>{item.name}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate">
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
        <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {item.protocol}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Gateway Status',
      sortable: true,
      render: (item) => (
        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
          {item.status === 'ACTIVE' ? (
            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
          ) : (
            <AlertTriangle className="w-3 h-3 mr-1 inline" />
          )}
          <span>{item.status}</span>
        </Badge>
      ),
    },
    {
      key: 'totalMessages',
      header: 'Volume (Inbound)',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-right">
          {item.totalMessages.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'successRate',
      header: 'Delivery Rate',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="text-right">
          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
            {item.successRate}%
          </span>
        </div>
      ),
    },
    {
      key: 'avgLatencyMs',
      header: 'Latency',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="font-mono text-slate-600 dark:text-slate-300 text-right">
          {item.avgLatencyMs}ms
        </div>
      ),
    },
    {
      key: 'throughputTps',
      header: 'Capacity Limit',
      sortable: true,
      className: 'text-right',
      render: (item) => (
        <div className="font-mono text-slate-500 text-right">
          {item.throughputTps} TPS
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Provider Gateway Connectivity & Traffic
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time multi-carrier delivery pipelines, HTTP Webhook & SMPP connection health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {providers.length} Connected Gateways
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
          onRowClick={onSelectProvider}
        />
      </div>
    </div>
  );
};
