import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { Table, ColumnDef } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar } from '../ui/FilterBar';
import { ShieldCheck, RefreshCw, KeyRound, Terminal, Clock } from 'lucide-react';

interface AuditRecord {
  id: string;
  userId?: string;
  email: string;
  action: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getAuditLogs();
      setLogs(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.email.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(search));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('AUTHENTICATED')) return 'success';
    if (action.includes('FAILED') || action.includes('ERROR')) return 'error';
    if (action.includes('LOGOUT')) return 'neutral';
    return 'info';
  };

  const columns: ColumnDef<AuditRecord>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (log) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action / Event Type',
      sortable: true,
      render: (log) => (
        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
          {log.action}
        </Badge>
      ),
    },
    {
      key: 'email',
      header: 'Actor Account',
      sortable: true,
      render: (log) => (
        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
          {log.email}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Source IP',
      render: (log) => (
        <span className="font-mono text-xs text-slate-500">
          {log.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Context / Reason',
      render: (log) => (
        <span className="text-xs text-slate-500 truncate max-w-xs block">
          {log.reason || 'Routine authorization'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Immutable Security Audit Trail
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tamper-evident logs of administrative actions, authentication attempts, and privilege elevations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter audit records by actor email, action, or IP..."
        filters={[
          {
            key: 'action',
            label: 'Event Type',
            value: actionFilter,
            onChange: setActionFilter,
            options: [
              { label: 'All Actions', value: 'ALL' },
              { label: 'Login Success', value: 'LOGIN_SUCCESS' },
              { label: 'Login Failed', value: 'LOGIN_FAILED' },
              { label: 'Logout', value: 'LOGOUT' },
            ],
          },
        ]}
        totalCount={logs.length}
        totalFiltered={filteredLogs.length}
      />

      {/* Table */}
      <Table<AuditRecord>
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
      />
    </div>
  );
};
