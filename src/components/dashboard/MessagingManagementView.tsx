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
  MessageSquare,
  ArrowDownLeft,
  ShieldCheck,
  RefreshCw,
  Search,
  Eye,
  Send,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Zap,
  Radio,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface InboundMessageItem {
  id: string;
  providerId: string;
  providerName: string;
  providerMessageId?: string;
  numberId: string;
  destinationAddress: string;
  senderAddress: string;
  body: string;
  clientId?: string;
  clientName: string;
  status: string;
  billingStatus: string;
  clientChargeDecimal?: number | null;
  providerCostDecimal?: number | null;
  currency: string;
  receivedAt: string;
  createdAt: string;
}

export const MessagingManagementView: React.FC = () => {
  const [messages, setMessages] = useState<InboundMessageItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [billingFilter, setBillingFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Simulation / Quick Test Modal
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simFormData, setSimFormData] = useState({
    providerId: '',
    fromNumber: '+15550192834',
    toNumber: '',
    body: 'Automated 2FA Verification Code: 489201. Do not share this code.',
  });
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);

  // Fetch Message Stream
  const fetchMessages = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.getInboundMessages({
        search: search || undefined,
        status: statusFilter,
        billingStatus: billingFilter,
        page,
        limit,
      });

      if (res && Array.isArray(res.items)) {
        setMessages(res.items);
        setTotal(res.total || res.items.length);
        setTotalPages(res.totalPages || Math.ceil((res.total || res.items.length) / limit) || 1);
      } else {
        setMessages([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      setError(err.message || 'Failed to retrieve inbound messages');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter, billingFilter, page, limit]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Load available inventory & providers for quick test modal
  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [numRes, provRes] = await Promise.all([
          apiClient.getNumbers({ limit: 50 }),
          apiClient.getProviders({ limit: 50 }),
        ]);
        if (numRes && Array.isArray(numRes.items)) {
          setAvailableNumbers(numRes.items);
          if (numRes.items.length > 0 && !simFormData.toNumber) {
            setSimFormData((prev) => ({ ...prev, toNumber: numRes.items[0].e164 }));
          }
        }
        if (provRes && Array.isArray(provRes.items)) {
          setAvailableProviders(provRes.items);
          if (provRes.items.length > 0 && !simFormData.providerId) {
            setSimFormData((prev) => ({ ...prev, providerId: provRes.items[0].id }));
          }
        }
      } catch (e) {
        console.warn('Prerequisites load error:', e);
      }
    };
    loadPrerequisites();
  }, []);

  const handleOpenDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await apiClient.getInboundMessageById(id);
      if (res && res.message) {
        setSelectedMessage(res.message);
      }
    } catch (err: any) {
      alert('Failed to load message detail: ' + err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simFormData.providerId || !simFormData.toNumber) {
      alert('Please select a valid provider and destination number');
      return;
    }
    setIsSimulating(true);
    try {
      const res = await apiClient.ingestInboundMessage({
        providerId: simFormData.providerId,
        providerMessageId: `webhook-sim-${Date.now()}`,
        fromNumber: simFormData.fromNumber,
        toNumber: simFormData.toNumber,
        body: simFormData.body,
      });

      setIsSimulateOpen(false);
      fetchMessages(true);
    } catch (err: any) {
      alert('Inbound ingestion failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Aggregated KPIs
  const totalReceived = total;
  const routedCount = messages.filter((m) => m.status === 'ROUTED' || m.status === 'DELIVERED').length;
  const billedCount = messages.filter((m) => m.billingStatus === 'BILLED' || m.billingStatus === 'RECONCILED').length;
  const totalClientCharges = messages.reduce((acc, m) => acc + (m.clientChargeDecimal || 0), 0);

  const columns: ColumnDef<InboundMessageItem>[] = [
    {
      key: 'status',
      header: 'Routing Status',
      render: (item) => {
        let variant: 'success' | 'warning' | 'info' | 'default' | 'danger' = 'info';
        if (item.status === 'ROUTED' || item.status === 'DELIVERED') variant = 'success';
        if (item.status === 'UNROUTED') variant = 'warning';
        if (item.status === 'FAILED') variant = 'danger';
        return (
          <Badge variant={variant} size="sm" dot>
            {item.status}
          </Badge>
        );
      },
    },
    {
      key: 'receivedAt',
      header: 'Received At',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-xs text-[var(--text-primary)] font-mono">
            {new Date(item.receivedAt).toLocaleTimeString()}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
            {new Date(item.receivedAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'fromNumber',
      header: 'From (Sender)',
      render: (item) => (
        <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
          {item.senderAddress}
        </span>
      ),
    },
    {
      key: 'toNumber',
      header: 'Destination (E.164)',
      render: (item) => (
        <span className="text-xs font-mono font-semibold text-[var(--accent-blue)]">
          {item.destinationAddress}
        </span>
      ),
    },
    {
      key: 'body',
      header: 'Message Content',
      render: (item) => (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-xs truncate" title={item.body}>
          {item.body || <span className="text-[var(--text-tertiary)] italic">(Empty payload)</span>}
        </p>
      ),
    },
    {
      key: 'provider',
      header: 'Carrier Provider',
      render: (item) => (
        <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-[var(--accent-cyan)]" />
          {item.providerName}
        </span>
      ),
    },
    {
      key: 'client',
      header: 'Assigned Client',
      render: (item) => (
        <span className="text-xs text-[var(--text-primary)] font-medium">
          {item.clientName}
        </span>
      ),
    },
    {
      key: 'billing',
      header: 'Financial Settlement',
      render: (item) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <Badge variant={item.billingStatus === 'BILLED' ? 'success' : 'warning'} size="sm">
              {item.billingStatus}
            </Badge>
            {item.clientChargeDecimal !== null && (
              <span className="text-[11px] font-mono text-[var(--accent-emerald)] font-medium">
                ${item.clientChargeDecimal?.toFixed(4)}
              </span>
            )}
          </div>
          {item.providerCostDecimal !== null && (
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
              Cost: ${item.providerCostDecimal?.toFixed(4)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Audit',
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenDetail(item.id)}
          className="flex items-center gap-1.5 text-xs py-1 px-2.5"
        >
          <Eye className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Standard Page Header Pattern */}
      <PageHeader
        title="Inbound SMS & Routing Engine"
        description="Carrier webhook ingestion stream, real-time client routing, and instantaneous micro-unit CDR billing."
        breadcrumbs={[{ label: 'Messaging' }, { label: 'Messages' }]}
        primaryAction={{
          label: 'Simulate Inbound Webhook',
          onClick: () => setIsSimulateOpen(true),
          icon: <Send className="w-3.5 h-3.5" />,
          id: 'btn-simulate-inbound-webhook',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMessages(true)}
            disabled={isRefreshing || isLoading}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh messaging stream"
          >
            Refresh Stream
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Ingested Messages"
              value={totalReceived.toLocaleString()}
              subtitle="All-time carrier ingest count"
              icon={<MessageSquare className="w-5 h-5 text-[var(--accent-blue)]" />}
              variant="default"
            />
            <StatCard
              title="Successfully Routed"
              value={routedCount.toLocaleString()}
              subtitle={`${totalReceived > 0 ? Math.round((routedCount / totalReceived) * 100) : 100}% dispatch accuracy`}
              icon={<CheckCircle2 className="w-5 h-5 text-[var(--accent-emerald)]" />}
              variant="success"
            />
            <StatCard
              title="Billed & Reconciled"
              value={billedCount.toLocaleString()}
              subtitle="Atomically cleared through ledger"
              icon={<ShieldCheck className="w-5 h-5 text-[var(--accent-violet)]" />}
              variant="default"
            />
            <StatCard
              title="Stream Revenue (Page)"
              value={`$${totalClientCharges.toFixed(4)}`}
              subtitle="Client micro-unit charges"
              icon={<DollarSign className="w-5 h-5 text-[var(--accent-emerald)]" />}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sender, destination (+E.164), or message body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Route Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ROUTED">ROUTED</option>
              <option value="UNROUTED">UNROUTED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Billing:</span>
            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-blue)]"
            >
              <option value="ALL">All Billing</option>
              <option value="BILLED">BILLED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="RECONCILED">RECONCILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      {error ? (
        <ErrorState
          title="Failed to Load Message Feed"
          message={error}
          onRetry={() => fetchMessages(true)}
        />
      ) : messages.length === 0 && !isLoading ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8 text-[var(--text-tertiary)]" />}
          title="No Inbound Messages Found"
          description="There are currently no inbound messages matching your filter criteria. You can simulate an incoming webhook using the button above."
          action={
            <Button size="sm" variant="primary" onClick={() => setIsSimulateOpen(true)}>
              Simulate Inbound SMS
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
          <Table
            columns={columns}
            data={messages}
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

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMessage(null)}
          title="Inbound SMS Transaction Inspection"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs text-[var(--text-secondary)]">
            {/* Top Meta Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)]">
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Message ID</span>
                <p className="font-mono text-xs text-[var(--text-primary)] truncate" title={selectedMessage.id}>
                  {selectedMessage.id.slice(0, 8)}...
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Route Status</span>
                <p className="font-semibold text-xs text-[var(--accent-emerald)]">{selectedMessage.status}</p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Billing Status</span>
                <p className="font-semibold text-xs text-[var(--accent-blue)]">{selectedMessage.billingStatus}</p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono">Received Time</span>
                <p className="font-mono text-xs text-[var(--text-primary)]">
                  {new Date(selectedMessage.receivedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Carrier & Routing Hierarchy */}
            <div className="space-y-2 p-3.5 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                Origin & Destination Routing
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Originating Number (From):</span>
                  <p className="font-mono font-medium text-[var(--text-primary)]">{selectedMessage.senderAddress}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Target DID / Number (To):</span>
                  <p className="font-mono font-semibold text-[var(--accent-blue)]">{selectedMessage.destinationAddress}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Carrier Gateway:</span>
                  <p className="text-[var(--text-primary)]">{selectedMessage.providerName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">Assigned Client Account:</span>
                  <p className="text-[var(--text-primary)] font-medium">{selectedMessage.clientName}</p>
                </div>
                {selectedMessage.agentName && (
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Managing Agent:</span>
                    <p className="text-[var(--text-primary)]">{selectedMessage.agentName}</p>
                  </div>
                )}
                {selectedMessage.providerMessageId && (
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)]">Carrier Ref ID:</span>
                    <p className="font-mono text-[var(--text-primary)]">{selectedMessage.providerMessageId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Full Payload Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Message Body Payload</span>
                <button
                  onClick={() => copyToClipboard(selectedMessage.body)}
                  className="flex items-center gap-1 text-[11px] text-[var(--accent-blue)] hover:underline"
                >
                  {isCopied ? <Check className="w-3 h-3 text-[var(--accent-emerald)]" /> : <Copy className="w-3 h-3" />}
                  {isCopied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] font-mono text-xs text-[var(--text-primary)] whitespace-pre-wrap select-all">
                {selectedMessage.body || '(Empty Message Payload)'}
              </div>
            </div>

            {/* Micro-Unit Financial Settlement */}
            {selectedMessage.financials && (
              <div className="p-3.5 rounded-lg border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.05)] space-y-2">
                <h4 className="text-xs font-semibold text-[var(--accent-emerald)] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Call Detail Record (CDR) Financials
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)] block">Provider Cost</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      ${selectedMessage.financials.providerCostDecimal?.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] block">
                      ({selectedMessage.financials.providerCostMicrounits} µu)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)] block">Client Charge</span>
                    <span className="text-[var(--accent-emerald)] font-medium">
                      ${selectedMessage.financials.clientChargeDecimal?.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] block">
                      ({selectedMessage.financials.clientChargeMicrounits} µu)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)] block">Platform Net Margin</span>
                    <span className="text-[var(--accent-cyan)] font-medium">
                      ${selectedMessage.financials.platformProfitDecimal?.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] block">
                      ({selectedMessage.financials.platformProfitMicrounits} µu)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Simulate Webhook Modal */}
      {isSimulateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsSimulateOpen(false)}
          title="Simulate Inbound Webhook Ingestion"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSimulateSubmit} className="space-y-4 text-xs">
            <p className="text-[var(--text-secondary)]">
              Dispatches a simulated inbound SMS event directly to the live backend carrier ingestion pipeline. This triggers automatic destination number lookup, active client routing, and the micro-unit billing engine.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">
                Carrier / Provider Gateway <span className="text-rose-500">*</span>
              </label>
              <select
                value={simFormData.providerId}
                onChange={(e) => setSimFormData({ ...simFormData, providerId: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              >
                <option value="">Select Gateway</option>
                {availableProviders.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type || 'Carrier'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">
                Destination DID / Inventory Number (To) <span className="text-rose-500">*</span>
              </label>
              <select
                value={simFormData.toNumber}
                onChange={(e) => setSimFormData({ ...simFormData, toNumber: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
              >
                <option value="">Select Inventory Number</option>
                {availableNumbers.map((n) => (
                  <option key={n.id} value={n.e164}>
                    {n.e164} - {n.status} {n.activeAssignment ? `(${n.activeAssignment.client?.name || 'Assigned'})` : '(Unassigned)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">
                Sender Number (From) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={simFormData.fromNumber}
                onChange={(e) => setSimFormData({ ...simFormData, fromNumber: e.target.value })}
                required
                placeholder="+15550192834"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">
                Message Body Content
              </label>
              <textarea
                rows={3}
                value={simFormData.body}
                onChange={(e) => setSimFormData({ ...simFormData, body: e.target.value })}
                placeholder="SMS message text payload..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--glass-border)]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsSimulateOpen(false)}
                disabled={isSimulating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSimulating}
                className="bg-[var(--accent-blue)] hover:bg-blue-600 flex items-center gap-1.5"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Inbound SMS
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
