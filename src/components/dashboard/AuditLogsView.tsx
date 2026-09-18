import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { Table, ColumnDef } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar } from '../ui/FilterBar';
import { PageHeader } from '../ui/PageHeader';
import { ErrorState } from '../ui/ErrorState';
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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve security audit logs from backend');
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
        <span className="font-mono text-xs text-[var(--text-secondary)]">
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
        <span className="font-mono font-medium text-[var(--text-primary)]">
          {log.email}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Source IP',
      render: (log) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {log.ipAddress || '—'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Context / Reason',
      render: (log) => (
        <span className="text-xs text-[var(--text-secondary)] truncate max-w-xs block">
          {log.reason || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Standard Page Header Pattern */}
      <PageHeader
        title="Security & Audit Trail"
        description="Tamper-evident logs of administrative actions, authentication attempts, and privilege elevations."
        breadcrumbs={[{ label: 'Platform' }, { label: 'Audit Logs' }]}
        primaryAction={{
          label: 'Refresh Logs',
          onClick: fetchLogs,
          icon: <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />,
          isLoading,
          id: 'btn-refresh-audit-logs',
          variant: 'outline',
        }}
      />

      {error ? (
        <ErrorState
          title="Failed to Load Audit Trail"
          message={error}
          onRetry={fetchLogs}
        />
      ) : (
        <>
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
            emptyMessage="No audit log records found"
          />
        </>
      )}
    </div>
  );
};
