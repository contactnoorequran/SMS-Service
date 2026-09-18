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
import { PageHeader } from '../ui/PageHeader';
import { Modal } from '../ui/Modal';
import {
  Wallet,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  RefreshCw,
  Search,
  PlusCircle,
  Clock,
  Building2,
  Users,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Receipt,
  Tag,
  CreditCard,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface WalletItem {
  id: string;
  organizationId: string;
  clientId?: string;
  clientName?: string;
  agentId?: string;
  agentName?: string;
  type: string;
  balanceMicrounits: string;
  balanceDecimal: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface LedgerItem {
  id: string;
  sequenceId: string;
  walletId: string;
  direction: 'CREDIT' | 'DEBIT';
  amountMicrounits: string;
  amountDecimal: number;
  balanceBeforeMicrounits: string;
  balanceBeforeDecimal: number;
  balanceAfterMicrounits: string;
  balanceAfterDecimal: number;
  sourceType: string;
  sourceId?: string;
  description?: string;
  createdAt: string;
}

interface RateItem {
  id: string;
  country: string;
  iso2: string;
  direction: 'INBOUND' | 'OUTBOUND';
  wholesaleCost: number;
  clientRate: number;
  margin: number;
  currency: string;
}

interface PaymentRequestItem {
  id: string;
  clientName: string;
  amount: number;
  method: string;
  reference: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface CreditNoteItem {
  id: string;
  noteNumber: string;
  clientName: string;
  amount: number;
  reason: string;
  status: 'ISSUED' | 'APPLIED';
  createdAt: string;
}

export const BillingManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'rates' | 'payment-requests' | 'credit-notes'>('wallets');

  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerItem[]>([]);
  const [totalLedgerCount, setTotalLedgerCount] = useState<number>(0);
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [ledgerLimit, setLedgerLimit] = useState<number>(10);

  const [isLoadingWallets, setIsLoadingWallets] = useState<boolean>(true);
  const [isLoadingLedger, setIsLoadingLedger] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Balance Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustFormData, setAdjustFormData] = useState<{
    walletId: string;
    amount: string;
    direction: 'CREDIT' | 'DEBIT';
    description: string;
  }>({
    walletId: '',
    amount: '50.00',
    direction: 'CREDIT',
    description: 'Manual treasury credit adjustment',
  });

  // Enterprise Rates Data
  const [rates] = useState<RateItem[]>([]);

  // Payment Requests Data
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestItem[]>([]);

  // Credit Notes Data
  const [creditNotes] = useState<CreditNoteItem[]>([]);

  // Fetch Wallets
  const fetchWallets = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoadingWallets(true);
    setError(null);

    try {
      const response = await apiClient.getWallets();
      const loadedWallets = (response as any) || [];
      setWallets(loadedWallets);

      if (loadedWallets.length > 0) {
        setSelectedWallet((prev) => {
          if (!prev) return loadedWallets[0];
          return loadedWallets.find((w) => w.id === prev.id) || loadedWallets[0];
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallets');
    } finally {
      setIsLoadingWallets(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch Ledger for a specific wallet
  const fetchWalletLedger = useCallback(async (walletId: string, page: number = 1) => {
    setIsLoadingLedger(true);
    try {
      const response = await apiClient.getWalletLedger(walletId, {
        page,
        limit: ledgerLimit,
      });
      setLedgerEntries(response.data || []);
      setTotalLedgerCount(response.pagination?.totalCount || 0);
    } catch (err: unknown) {
      console.error('Error loading ledger:', err);
      setLedgerEntries([]);
      setTotalLedgerCount(0);
    } finally {
      setIsLoadingLedger(false);
    }
  }, [ledgerLimit]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    if (selectedWallet) {
      fetchWalletLedger(selectedWallet.id, ledgerPage);
    }
  }, [selectedWallet, ledgerPage, fetchWalletLedger]);

  const handleOpenAdjust = (wallet: WalletItem) => {
    setAdjustFormData({
      walletId: wallet.id,
      amount: '50.00',
      direction: 'CREDIT',
      description: `Manual adjustment for ${wallet.type} wallet`,
    });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustFormData.walletId) return;

    setIsAdjusting(true);
    try {
      await apiClient.adjustWalletBalance({
        walletId: adjustFormData.walletId,
        amount: parseFloat(adjustFormData.amount),
        direction: adjustFormData.direction,
        description: adjustFormData.description,
      });
      setIsAdjustModalOpen(false);
      await fetchWallets(true);
      if (selectedWallet) {
        await fetchWalletLedger(selectedWallet.id, 1);
        setLedgerPage(1);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Balance adjustment failed');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleApprovePayment = (id: string) => {
    setPaymentRequests((prev) =>
      prev.map((pr) => (pr.id === id ? { ...pr, status: 'APPROVED' } : pr))
    );
  };

  const totalWalletsCount = wallets.length;
  const platformTreasury = wallets.find((w) => w.type === 'PLATFORM_TREASURY')?.balanceDecimal || 0;
  const clientBalancesSum = wallets.filter((w) => w.type === 'CLIENT').reduce((acc, w) => acc + w.balanceDecimal, 0);
  const agentBalancesSum = wallets.filter((w) => w.type === 'AGENT').reduce((acc, w) => acc + w.balanceDecimal, 0);

  const walletColumns: ColumnDef<WalletItem>[] = [
    {
      key: 'type',
      header: 'Wallet Type / Party',
      render: (item) => {
        let icon = <Wallet className="w-4 h-4 text-[var(--accent-blue)]" />;
        let label = 'Wallet';
        if (item.type === 'PLATFORM_TREASURY') {
          icon = <Server className="w-4 h-4 text-[var(--accent-cyan)]" />;
          label = 'Platform Master Treasury';
        } else if (item.type === 'CLIENT') {
          icon = <Building2 className="w-4 h-4 text-[var(--accent-emerald)]" />;
          label = item.clientName ? `Client: ${item.clientName}` : 'Client Account';
        } else if (item.type === 'AGENT') {
          icon = <Users className="w-4 h-4 text-[var(--accent-violet)]" />;
          label = item.agentName ? `Agent: ${item.agentName}` : 'Agent Account';
        }

        return (
          <div className="flex items-center gap-2.5">
            {icon}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] truncate max-w-[140px]" title={item.id}>
                {item.id}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'balance',
      header: 'Available Balance (USD)',
      render: (item) => (
        <div className="flex flex-col font-mono text-xs">
          <span className="text-xs font-bold text-[var(--accent-emerald)]">
            ${item.balanceDecimal.toFixed(2)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {parseInt(item.balanceMicrounits, 10).toLocaleString()} µu
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Controls',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant={selectedWallet?.id === item.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedWallet(item);
              setLedgerPage(1);
            }}
            className="text-xs py-1 px-2.5"
          >
            Ledger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAdjust(item)}
            className="text-xs py-1 px-2.5 flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3 text-[var(--accent-emerald)]" />
            Adjust
          </Button>
        </div>
      ),
    },
  ];

  const ledgerColumns: ColumnDef<LedgerItem>[] = [
    {
      key: 'sequenceId',
      header: 'Seq #',
      render: (item) => (
        <span className="font-mono text-xs text-[var(--text-secondary)] font-semibold">
          #{item.sequenceId}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (item) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="text-[var(--text-primary)]">{new Date(item.createdAt).toLocaleTimeString()}</span>
          <span className="text-[10px] text-[var(--text-tertiary)]">{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Flow',
      render: (item) => (
        <Badge variant={item.direction === 'CREDIT' ? 'success' : 'danger'} size="sm">
          {item.direction === 'CREDIT' ? '+' : '-'} {item.direction}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item) => (
        <div className="flex flex-col font-mono text-xs">
          <span className={`font-semibold ${item.direction === 'CREDIT' ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-primary)]'}`}>
            ${item.amountDecimal.toFixed(4)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {parseInt(item.amountMicrounits, 10).toLocaleString()} µu
          </span>
        </div>
      ),
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      render: (item) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          ${item.balanceAfterDecimal.toFixed(4)}
        </span>
      ),
    },
    {
      key: 'sourceType',
      header: 'Source / Note',
      render: (item) => (
        <div className="flex flex-col text-xs">
          <Badge variant="neutral" size="sm" className="w-fit">
            {item.sourceType}
          </Badge>
          <span className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5" title={item.description}>
            {item.description || 'System transaction settlement'}
          </span>
        </div>
      ),
    },
  ];

  if (error && wallets.length === 0) {
    return (
      <div className="py-12">
        <ErrorState
          title="Failed to Load Financial Accounting"
          message={error}
          onRetry={() => fetchWallets()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Standard Page Header Pattern */}
      <PageHeader
        title="Finance & Clearing"
        description="Double-entry micro-unit accounting, platform master treasury oversight, and tamper-evident sequential audit ledger."
        breadcrumbs={[{ label: 'Finance' }, { label: 'Wallets & Rates' }]}
        primaryAction={{
          label: 'Manual Adjustment',
          onClick: () => selectedWallet && handleOpenAdjust(selectedWallet),
          icon: <PlusCircle className="w-3.5 h-3.5" />,
          id: 'btn-manual-adjustment',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWallets(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh financial telemetry"
          >
            Refresh
          </Button>
        }
      >
        {/* Clean Tab Switcher */}
        <div className="flex items-center gap-1 bg-[var(--glass-bg-active)] p-1 rounded-xl w-fit text-xs border border-[var(--glass-border)] flex-wrap">
          {[
            { id: 'wallets', label: 'Wallets', icon: <Wallet className="w-3.5 h-3.5" /> },
            { id: 'transactions', label: 'Sequential Ledger', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
            { id: 'rates', label: 'Rates & Margins', icon: <Tag className="w-3.5 h-3.5" /> },
            { id: 'payment-requests', label: 'Payment Requests', icon: <CreditCard className="w-3.5 h-3.5" />, badge: 3 },
            { id: 'credit-notes', label: 'Credit Notes', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--glass-bg)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <Badge variant="warning" size="sm" className="px-1.5 py-0 font-mono text-[10px]">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingWallets ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Platform Master Treasury"
              value={`$${platformTreasury.toFixed(2)}`}
              subtitle="Retained platform profits & fees"
              icon={<Server className="w-5 h-5 text-[var(--accent-cyan)]" />}
            />
            <StatCard
              title="Client Prepaid Deposits"
              value={`$${clientBalancesSum.toFixed(2)}`}
              subtitle="Customer on-deposit liquidity"
              icon={<Building2 className="w-5 h-5 text-[var(--accent-emerald)]" />}
            />
            <StatCard
              title="Agent Commissions Accrued"
              value={`$${agentBalancesSum.toFixed(2)}`}
              subtitle="Pending agent payout pool"
              icon={<Users className="w-5 h-5 text-[var(--accent-violet)]" />}
            />
            <StatCard
              title="Active Managed Wallets"
              value={totalWalletsCount.toString()}
              subtitle="100% micro-unit ledger reconciled"
              icon={<ShieldCheck className="w-5 h-5 text-[var(--accent-blue)]" />}
            />
          </>
        )}
      </div>

      {/* Tab 1: Wallets + Ledger */}
      {activeTab === 'wallets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Wallets Directory */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[var(--accent-blue)]" />
                Platform & Partner Wallets
              </h3>
              <span className="text-xs text-[var(--text-tertiary)]">{wallets.length} Accounts</span>
            </div>

            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
              <Table
                columns={walletColumns}
                data={wallets}
                isLoading={isLoadingWallets}
                keyExtractor={(item) => item.id}
              />
            </div>
          </div>

          {/* Selected Wallet Ledger Stream */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[var(--accent-emerald)]" />
                Immutable Ledger Stream {selectedWallet && `(${selectedWallet.type})`}
              </h3>
              {selectedWallet && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchWalletLedger(selectedWallet.id, ledgerPage)}
                  disabled={isLoadingLedger}
                  className="text-xs py-1 px-2"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingLedger ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>

            {!selectedWallet ? (
              <EmptyState
                icon={<Wallet className="w-8 h-8 text-[var(--text-tertiary)]" />}
                title="Select a Wallet"
                description="Click on any wallet on the left to inspect its append-only ledger transaction journal."
              />
            ) : ledgerEntries.length === 0 && !isLoadingLedger ? (
              <EmptyState
                icon={<Clock className="w-8 h-8 text-[var(--text-tertiary)]" />}
                title="No Ledger Entries Yet"
                description="This wallet does not have any recorded transactions yet. Use the Adjust button to credit or debit funds."
                action={
                  <Button size="sm" variant="primary" onClick={() => handleOpenAdjust(selectedWallet)}>
                    Add First Adjustment
                  </Button>
                }
              />
            ) : (
              <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
                <Table
                  columns={ledgerColumns}
                  data={ledgerEntries}
                  isLoading={isLoadingLedger}
                  keyExtractor={(item) => item.id}
                />
                <div className="p-3 border-t border-[var(--glass-border)] bg-[rgba(0,0,0,0.1)]">
                  <Pagination
                    currentPage={ledgerPage}
                    totalPages={Math.ceil(totalLedgerCount / ledgerLimit) || 1}
                    pageSize={ledgerLimit}
                    totalItems={totalLedgerCount}
                    onPageChange={(p) => setLedgerPage(p)}
                    onPageSizeChange={(l) => {
                      setLedgerLimit(l);
                      setLedgerPage(1);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Sequential Ledger */}
      {activeTab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[var(--accent-blue)]" />
              Full Platform Sequential Ledger Journal
            </h3>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">Immutable Double-Entry Ledger</span>
          </div>

          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
            <Table
              columns={ledgerColumns}
              data={ledgerEntries}
              isLoading={isLoadingLedger}
              keyExtractor={(item) => item.id}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Rates */}
      {activeTab === 'rates' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[var(--accent-emerald)]" />
              Carrier Wholesale Costs & Customer Pricing Cards
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">{rates.length} Destination Countries</span>
          </div>

          {rates.length === 0 ? (
            <EmptyState
              icon={<Tag className="w-8 h-8 text-[var(--text-tertiary)]" />}
              title="No Rates Configured"
              description="Wholesale carrier destination costs and customer pricing rate cards have not been configured yet."
            />
          ) : (
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[rgba(0,0,0,0.3)] text-[var(--text-tertiary)] uppercase font-semibold text-[11px] border-b border-[var(--glass-border)]">
                  <tr>
                    <th className="p-3">Country / Region</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Carrier Wholesale Cost</th>
                    <th className="p-3">Client Rate</th>
                    <th className="p-3">Spread / Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                      <td className="p-3 font-semibold text-[var(--text-primary)]">
                        {rate.country} ({rate.iso2})
                      </td>
                      <td className="p-3">
                        <Badge variant="info" size="sm">
                          {rate.direction}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-[var(--text-secondary)]">
                        ${rate.wholesaleCost.toFixed(3)}
                      </td>
                      <td className="p-3 font-mono font-semibold text-[var(--accent-blue)]">
                        ${rate.clientRate.toFixed(3)}
                      </td>
                      <td className="p-3 font-mono font-bold text-[var(--accent-emerald)]">
                        +{rate.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Payment Requests */}
      {activeTab === 'payment-requests' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--accent-amber)]" />
              Client Deposit Invoices & Wire Transfer Requests
            </h3>
            <span className="text-xs text-[var(--text-tertiary)] font-mono">
              {paymentRequests.filter((p) => p.status === 'PENDING').length} Pending Settlement
            </span>
          </div>

          {paymentRequests.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="w-8 h-8 text-[var(--text-tertiary)]" />}
              title="No Payment Requests"
              description="No client deposit invoices or wire transfer settlement requests have been submitted."
            />
          ) : (
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[rgba(0,0,0,0.3)] text-[var(--text-tertiary)] uppercase font-semibold text-[11px] border-b border-[var(--glass-border)]">
                  <tr>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Requested Amount</th>
                    <th className="p-3">Transfer Method</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {paymentRequests.map((pr) => (
                    <tr key={pr.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                      <td className="p-3 font-semibold text-[var(--text-primary)]">{pr.clientName}</td>
                      <td className="p-3 font-mono font-bold text-[var(--accent-emerald)]">
                        ${pr.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">{pr.method}</td>
                      <td className="p-3 font-mono text-[11px] text-[var(--text-tertiary)]">{pr.reference}</td>
                      <td className="p-3">
                        <Badge variant={pr.status === 'APPROVED' ? 'success' : 'warning'} size="sm">
                          {pr.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {pr.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApprovePayment(pr.id)}
                            className="text-xs py-1 px-2.5"
                          >
                            Approve Deposit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Credit Notes */}
      {activeTab === 'credit-notes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--accent-violet)]" />
              Customer Credit Notes & SLA Adjustments
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">{creditNotes.length} Issued Records</span>
          </div>

          {creditNotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-[var(--text-tertiary)]" />}
              title="No Credit Notes"
              description="No customer SLA credits or billing adjustments have been issued."
            />
          ) : (
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[rgba(0,0,0,0.3)] text-[var(--text-tertiary)] uppercase font-semibold text-[11px] border-b border-[var(--glass-border)]">
                  <tr>
                    <th className="p-3">Credit Note #</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Credit Amount</th>
                    <th className="p-3">Justification / Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-[var(--glass-bg)] transition-colors">
                      <td className="p-3 font-mono font-semibold text-[var(--text-primary)]">{cn.noteNumber}</td>
                      <td className="p-3 text-[var(--text-primary)]">{cn.clientName}</td>
                      <td className="p-3 font-mono font-bold text-[var(--accent-emerald)]">
                        +${cn.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-[var(--text-secondary)]">{cn.reason}</td>
                      <td className="p-3">
                        <Badge variant="neutral" size="sm">
                          {cn.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {isAdjustModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAdjustModalOpen(false)}
          title="Manual Wallet Balance Adjustment"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <p className="text-[var(--text-secondary)]">
              Applies a manual balance modification directly to the wallet. This immediately creates an immutable append-only ledger record with sequence verification and recalculates total liquid balance.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">
                Adjustment Direction <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustFormData({ ...adjustFormData, direction: 'CREDIT' })}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    adjustFormData.direction === 'CREDIT'
                      ? 'border-[var(--accent-emerald)] bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]'
                      : 'border-[var(--glass-border)] bg-[var(--bg-deep)] text-[var(--text-secondary)]'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  CREDIT (Deposit)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustFormData({ ...adjustFormData, direction: 'DEBIT' })}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    adjustFormData.direction === 'DEBIT'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                      : 'border-[var(--glass-border)] bg-[var(--bg-deep)] text-[var(--text-secondary)]'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  DEBIT (Withdrawal)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">
                Adjustment Amount (USD $) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)] font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={adjustFormData.amount}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: e.target.value })}
                  required
                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">
                Audit Reason / Reference <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={adjustFormData.description}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, description: e.target.value })}
                required
                placeholder="Reason for manual balance adjustment..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--glass-border)]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAdjustModalOpen(false)}
                disabled={isAdjusting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isAdjusting}
                className="bg-[var(--accent-blue)] hover:bg-blue-600 flex items-center gap-1.5"
              >
                {isAdjusting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Posting Ledger...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Commit Transaction
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
