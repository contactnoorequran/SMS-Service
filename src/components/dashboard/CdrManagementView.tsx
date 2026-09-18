/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/api';
import { StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, ColumnDef } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { StatCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { PageHeader } from '../ui/PageHeader';
import { Modal } from '../ui/Modal';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  Building2,
  Radio,
  FileCheck2,
  Layers,
  Shield,
  CreditCard,
  Download,
} from 'lucide-react';

interface CdrItem {
  id: string;
  inboundMessageId?: string;
  providerId: string;
  providerName: string;
  clientId?: string;
  clientName: string;
  agentId?: string;
  agentName?: string;
  direction: string;
  providerCostMicrounits: string;
  providerCostDecimal: number;
  clientChargeMicrounits: string;
  clientChargeDecimal: number;
  agentCommissionMicrounits: string;
  agentCommissionDecimal: number;
  platformProfitMicrounits: string;
  platformProfitDecimal: number;
  marginPercent: number;
  currency: string;
  createdAt: string;
}

interface CdrSummary {
  totalRecords: number;
  totalClientRevenue: number;
  totalProviderCost: number;
  totalAgentCommission: number;
  totalPlatformProfit: number;
  grossMarginPercent: number;
  currency: string;
}

export const CdrManagementView: React.FC = () => {
  const [cdrs, setCdrs] = useState<CdrItem[]>([]);
  const [summary, setSummary] = useState<CdrSummary | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector Modal
  const [inspectedCdr, setInspectedCdr] = useState<any | null>(null);

  const fetchCdrData = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [listRes, summaryRes] = await Promise.all([
        apiClient.getCdrs({
          search: search || undefined,
          status: statusFilter,
          page,
          limit,
        }),
        apiClient.getCdrSummary().catch(() => null),
      ]);

      if (listRes && Array.isArray(listRes.items)) {
        setCdrs(listRes.items);
        setTotal(listRes.total || listRes.items.length);
        setTotalPages(listRes.totalPages || Math.ceil((listRes.total || listRes.items.length) / limit) || 1);
      } else {
        setCdrs([]);
        setTotal(0);
        setTotalPages(1);
      }

      if (summaryRes && summaryRes.summary) {
        setSummary(summaryRes.summary);
      } else if (listRes && Array.isArray(listRes.items)) {
        // Fallback aggregate calculation from current dataset
        const totalClientRevenue = listRes.items.reduce((acc: number, c: any) => acc + (c.clientChargeDecimal || 0), 0);
        const totalProviderCost = listRes.items.reduce((acc: number, c: any) => acc + (c.providerCostDecimal || 0), 0);
        const totalPlatformProfit = totalClientRevenue - totalProviderCost;
        const grossMarginPercent = totalClientRevenue > 0 ? (totalPlatformProfit / totalClientRevenue) * 100 : 0;
        setSummary({
          totalRecords: listRes.total || listRes.items.length,
          totalClientRevenue,
          totalProviderCost,
          totalAgentCommission: 0,
          totalPlatformProfit,
          grossMarginPercent,
          currency: 'USD',
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch CDRs:', err);
      setError(err.message || 'Failed to retrieve Call Detail Records');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    fetchCdrData();
  }, [fetchCdrData]);

  const handleExportCsv = () => {
    if (cdrs.length === 0) return;
    const headers = ['CDR ID', 'Date', 'Direction', 'Provider', 'Client', 'Provider Cost ($)', 'Client Charge ($)', 'Net Profit ($)', 'Margin %'];
    const rows = cdrs.map((c) => [
      c.id,
      new Date(c.createdAt).toISOString(),
      c.direction,
      c.providerName,
      c.clientName,
      c.providerCostDecimal.toFixed(6),
      c.clientChargeDecimal.toFixed(6),
      c.platformProfitDecimal.toFixed(6),
      `${c.marginPercent.toFixed(1)}%`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((f) => `"${f}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cdr-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<CdrItem>[] = [
    {
      key: 'id',
      header: 'CDR Reference',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
            {item.id.slice(0, 8)}...{item.id.slice(-4)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
            {new Date(item.createdAt).toLocaleTimeString()} · {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (item) => (
        <Badge variant="info" size="sm">
          {item.direction}
        </Badge>
      ),
    },
    {
      key: 'parties',
      header: 'Routing Entities',
      render: (item) => (
        <div className="flex flex-col text-xs space-y-0.5">
          <span className="text-[var(--text-primary)] font-medium flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-[var(--accent-blue)]" />
            {item.clientName}
          </span>
          <span className="text-[var(--text-tertiary)] flex items-center gap-1.5 text-[11px]">
            <Radio className="w-3 h-3 text-[var(--accent-cyan)]" />
            {item.providerName}
          </span>
        </div>
      ),
    },
    {
      key: 'providerCost',
      header: 'Wholesale Cost (COGS)',
      render: (item) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="text-[var(--text-secondary)] font-medium">
            ${item.providerCostDecimal.toFixed(4)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {item.providerCostMicrounits} µu
          </span>
        </div>
      ),
    },
    {
      key: 'clientCharge',
      header: 'Client Invoiced',
      render: (item) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="text-[var(--accent-emerald)] font-semibold">
            ${item.clientChargeDecimal.toFixed(4)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {item.clientChargeMicrounits} µu
          </span>
        </div>
      ),
    },
    {
      key: 'profit',
      header: 'Net Spread / Margin',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col font-mono text-xs">
            <span className="text-[var(--accent-cyan)] font-semibold">
              +${item.platformProfitDecimal.toFixed(4)}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {item.platformProfitMicrounits} µu
            </span>
          </div>
          <Badge
            variant={item.marginPercent >= 40 ? 'success' : item.marginPercent >= 20 ? 'info' : 'warning'}
            size="sm"
          >
            {item.marginPercent.toFixed(1)}%
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Audit Ledger',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setInspectedCdr(item)}
          className="flex items-center gap-1 text-xs py-1 px-2.5"
        >
          <Eye className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
          Audit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Standard Page Header Pattern */}
      <PageHeader
        title="Call Detail Records (CDR) & Margins"
        description="Micro-unit precision financial clearing ($1.00 = 1,000,000 µu), wholesale carrier COGS, and spread analytics."
        breadcrumbs={[{ label: 'Messaging' }, { label: 'CDR' }]}
        primaryAction={{
          label: 'Export CSV',
          onClick: handleExportCsv,
          icon: <Download className="w-3.5 h-3.5" />,
          disabled: cdrs.length === 0,
          id: 'btn-export-cdr-csv',
          variant: 'outline',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCdrData(true)}
            disabled={isRefreshing || isLoading}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh CDR records"
          >
            Refresh Records
          </Button>
        }
      />

      {/* Aggregate KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && !summary ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Invoiced Revenue"
              value={`$${(summary?.totalClientRevenue || 0).toFixed(4)}`}
              subtitle={`${summary?.totalRecords || total} total billed transactions`}
              icon={<DollarSign className="w-5 h-5 text-[var(--accent-emerald)]" />}
              variant="success"
            />
            <StatCard
              title="Wholesale Carrier COGS"
              value={`$${(summary?.totalProviderCost || 0).toFixed(4)}`}
              subtitle="Direct carrier interconnect costs"
              icon={<Radio className="w-5 h-5 text-[var(--accent-amber)]" />}
              variant="warning"
            />
            <StatCard
              title="Net Platform Spread"
              value={`$${(summary?.totalPlatformProfit || 0).toFixed(4)}`}
              subtitle="Retained platform treasury profit"
              icon={<TrendingUp className="w-5 h-5 text-[var(--accent-cyan)]" />}
              variant="default"
            />
            <StatCard
              title="Gross Realized Margin"
              value={`${(summary?.grossMarginPercent || 0).toFixed(1)}%`}
              subtitle="Blended gross profit margin"
              icon={<Percent className="w-5 h-5 text-[var(--accent-violet)]" />}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search CDR reference ID, carrier, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)] font-medium">Financial Direction:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)]"
          >
            <option value="ALL">All Directions</option>
            <option value="INBOUND">INBOUND</option>
            <option value="OUTBOUND">OUTBOUND</option>
          </select>
        </div>
      </div>

      {/* CDR Table */}
      {error ? (
        <ErrorState
          title="Failed to Load CDR Records"
          message={error}
          onRetry={() => fetchCdrData(true)}
        />
      ) : cdrs.length === 0 && !isLoading ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-[var(--text-tertiary)]" />}
          title="No Call Detail Records Available"
          description="There are currently no CDR entries logged in the financial clearing pipeline. Any incoming SMS processed via carrier webhooks will generate immutable CDR records here."
        />
      ) : (
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
          <Table
            columns={columns}
            data={cdrs}
            isLoading={isLoading}
            keyExtractor={(item) => item.id}
          />
          <div className="p-4 border-t border-[var(--glass-border)] bg-[rgba(0,0,0,0.1)]">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={limit}
              totalItems={total}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* Deep Audit Modal */}
      {inspectedCdr && (
        <Modal
          isOpen={true}
          onClose={() => setInspectedCdr(null)}
          title="Call Detail Record (CDR) Financial Audit"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs text-[var(--text-secondary)]">
            {/* ID & Timestamp */}
            <div className="p-3 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">CDR Record ID</span>
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{inspectedCdr.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">Inbound Message ID</span>
                <span className="font-mono text-xs text-[var(--accent-blue)]">{inspectedCdr.inboundMessageId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">Settled Timestamp</span>
                <span className="font-mono text-xs text-[var(--text-primary)]">
                  {new Date(inspectedCdr.createdAt).toISOString()}
                </span>
              </div>
            </div>

            {/* Micro-Unit Mathematical Audit */}
            <div className="p-3.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] space-y-3">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                Micro-Unit Integer Ledger Breakdown
              </h4>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                All calculations are executed in native 64-bit integer micro-units ($1.00 = 1,000,000 µu) to eliminate IEEE-754 floating-point rounding errors.
              </p>

              <div className="space-y-2 border-t border-[var(--glass-border)] pt-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Carrier Wholesale COGS:</span>
                  <span className="text-[var(--text-primary)]">
                    ${inspectedCdr.providerCostDecimal.toFixed(6)} ({inspectedCdr.providerCostMicrounits} µu)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Client Invoiced Charge:</span>
                  <span className="text-[var(--accent-emerald)] font-semibold">
                    ${inspectedCdr.clientChargeDecimal.toFixed(6)} ({inspectedCdr.clientChargeMicrounits} µu)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Agent Commission Share:</span>
                  <span className="text-[var(--accent-violet)]">
                    ${inspectedCdr.agentCommissionDecimal.toFixed(6)} ({inspectedCdr.agentCommissionMicrounits} µu)
                  </span>
                </div>
                <div className="flex justify-between border-t border-[var(--glass-border)] pt-2">
                  <span className="text-[var(--text-primary)] font-semibold">Net Retained Platform Profit:</span>
                  <span className="text-[var(--accent-cyan)] font-bold">
                    +${inspectedCdr.platformProfitDecimal.toFixed(6)} ({inspectedCdr.platformProfitMicrounits} µu)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Transaction Realized Margin:</span>
                  <span className="text-[var(--accent-emerald)] font-bold">
                    {inspectedCdr.marginPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setInspectedCdr(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
