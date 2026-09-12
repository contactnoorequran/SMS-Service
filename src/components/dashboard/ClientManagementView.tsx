import React, { useState, useEffect, useCallback } from 'react';
import {
  ClientListItem,
  ClientDetail,
  ClientDashboardData,
} from '../../types/client';
import { AgentListItem } from '../../types/agent';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { CreateClientModal } from './clients/CreateClientModal';
import { EditClientModal } from './clients/EditClientModal';
import { ClientStatusModal } from './clients/ClientStatusModal';
import { ClientResetPasswordModal } from './clients/ClientResetPasswordModal';
import { ClientPermissionsModal } from './clients/ClientPermissionsModal';
import { ClientApiAccessModal } from './clients/ClientApiAccessModal';
import { ClientDetailsModal } from './clients/ClientDetailsModal';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Filter,
  Eye,
  Edit2,
  Power,
  KeyRound,
  ShieldCheck,
  Key,
  Phone,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Inbox,
  Send,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const ClientManagementView: React.FC = () => {
  const { user, role, hasPermission } = useAuth();

  // If the logged in user is a CLIENT, we render their dedicated Client Dashboard
  const isClientRole = role === 'CLIENT';

  // Client Dashboard state (for CLIENT role)
  const [clientDashboard, setClientDashboard] = useState<ClientDashboardData | null>(null);
  const [isClientDashLoading, setIsClientDashLoading] = useState(false);

  // Administrative / Agent listing state
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    suspended: number;
    inactive: number;
    totalBalance: number;
    totalSmsCount: number;
    totalNumbers: number;
  }>({
    total: 0,
    active: 0,
    suspended: 0,
    inactive: 0,
    totalBalance: 0,
    totalSmsCount: 0,
    totalNumbers: 0,
  });

  const [scopeInfo, setScopeInfo] = useState<{
    actorRole: string;
    isScoped: boolean;
    scopeName?: string;
  }>({
    actorRole: role,
    isScoped: role !== 'SUPER_ADMIN',
  });

  // Query / Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [billingFilter, setBillingFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isApiAccessOpen, setIsApiAccessOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);

  // Permission guards
  const canCreate = role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'AGENT';
  const canEdit = role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'AGENT';
  const canModifyStatus = role === 'SUPER_ADMIN' || role === 'MANAGER';
  const canResetPassword = role === 'SUPER_ADMIN' || role === 'MANAGER';
  const canConfigurePermissions = role === 'SUPER_ADMIN';
  const canConfigureApi = role === 'SUPER_ADMIN' || role === 'MANAGER';

  // Fetch client dashboard if logged in as CLIENT
  const fetchClientDashboard = useCallback(async () => {
    setIsClientDashLoading(true);
    setError(null);
    try {
      const data = await apiClient.getCurrentClientDashboard();
      setClientDashboard(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load client dashboard.');
    } finally {
      setIsClientDashLoading(false);
    }
  }, []);

  // Fetch administrative list of clients
  const fetchClients = useCallback(async () => {
    if (isClientRole) {
      fetchClientDashboard();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getClients({
        search: search.trim() || undefined,
        status: statusFilter,
        billingType: billingFilter,
        page,
        limit,
      });

      setClients(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);

      if (res.stats) {
        setStats(res.stats);
      }
      if (res.scope) {
        setScopeInfo(res.scope);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load clients list.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, billingFilter, page, limit, isClientRole, fetchClientDashboard]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Open details modal
  const handleOpenDetails = async (client: ClientListItem) => {
    try {
      const full = await apiClient.getClientById(client.id);
      setSelectedClient(full);
      setIsDetailsOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch client details.');
    }
  };

  const handleOpenEdit = async (client: ClientListItem) => {
    try {
      const full = await apiClient.getClientById(client.id);
      setSelectedClient(full);
      setIsEditOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch client details.');
    }
  };

  const handleOpenStatus = async (client: ClientListItem) => {
    try {
      const full = await apiClient.getClientById(client.id);
      setSelectedClient(full);
      setIsStatusOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch client details.');
    }
  };

  const handleOpenPassword = async (client: ClientListItem) => {
    try {
      const full = await apiClient.getClientById(client.id);
      setSelectedClient(full);
      setIsPasswordOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch client details.');
    }
  };

  const handleOpenPermissions = async (client: ClientListItem) => {
    try {
      const full = await apiClient.getClientById(client.id);
      setSelectedClient(full);
      setIsPermissionsOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch client details.');
    }
  };

  const handleOpenApiAccess = async (client: ClientListItem) => {
    try {
      const full = await apiClient.getClientById(client.id);
      setSelectedClient(full);
      setIsApiAccessOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch client details.');
    }
  };

  // ==========================================
  // CLIENT PORTAL VIEW (For CLIENT User Role)
  // ==========================================
  if (isClientRole) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Client Service Dashboard
              </h1>
              <Badge variant="success">Verified Account</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time balance, allocated numbers, SMS metrics, and API integration endpoints
            </p>
          </div>

          <button
            onClick={fetchClientDashboard}
            disabled={isClientDashLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isClientDashLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isClientDashLoading && !clientDashboard ? (
          <div className="flex items-center justify-center py-16 text-xs text-slate-400">
            <span className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mr-2" />
            Loading customer telemetry and wallet status...
          </div>
        ) : clientDashboard ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Balance Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Balance</span>
                  <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${clientDashboard.balance.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{clientDashboard.balance.currency}</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Billing: {clientDashboard.balance.billingType}</span>
                  {clientDashboard.balance.creditLimit > 0 && (
                    <span>Limit: ${clientDashboard.balance.creditLimit}</span>
                  )}
                </div>
              </div>

              {/* Total SMS Sent */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Messages Dispatched</span>
                  <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Send className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {clientDashboard.smsStatistics.totalSms.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{clientDashboard.smsStatistics.deliveredSms} delivered successfully</span>
                </div>
              </div>

              {/* Assigned Numbers */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Allocated Numbers</span>
                  <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Phone className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {clientDashboard.assignedNumbers.length}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Ready for two-way SMS & inbound callbacks
                </div>
              </div>

              {/* API Integration Status */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">API Gateway Status</span>
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Key className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <Badge variant={clientDashboard.apiStatus.enabled ? 'success' : 'neutral'}>
                    {clientDashboard.apiStatus.enabled ? 'Active / Online' : 'Access Suspended'}
                  </Badge>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Rate Limit: {clientDashboard.apiStatus.rateLimitPerSecond || 100} req/sec
                </div>
              </div>
            </div>

            {/* Assigned Phone Numbers & Recent SMS Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Numbers Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-500" />
                    Allocated Phone Numbers
                  </h3>
                  <span className="text-xs text-slate-500">{clientDashboard.assignedNumbers.length} numbers</span>
                </div>

                {clientDashboard.assignedNumbers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No numbers allocated to your account yet. Contact your assigned representative.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clientDashboard.assignedNumbers.map((num) => (
                      <div
                        key={num.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {num.e164}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-2">({num.type || 'LOCAL'})</span>
                        </div>
                        <Badge variant={num.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {num.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent SMS History */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-indigo-500" />
                    Recent SMS Transmissions
                  </h3>
                  <span className="text-xs text-slate-500">Live Traffic Feed</span>
                </div>

                {clientDashboard.recentSms.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No recent SMS recorded.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {clientDashboard.recentSms.map((sms) => (
                      <div
                        key={sms.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-slate-500">To:</span>
                            <span className="font-medium text-slate-900 dark:text-white">{sms.recipient}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 line-clamp-1">
                            {sms.text}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge
                            variant={
                              sms.status === 'DELIVERED'
                                ? 'success'
                                : sms.status === 'PENDING'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {sms.status}
                          </Badge>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {new Date(sms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // ========================================================
  // ADMINISTRATIVE / AGENT / MANAGER CLIENT MANAGEMENT VIEW
  // ========================================================
  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Client Management
            </h1>
            <Badge variant="neutral">Phase 07</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise customer portfolio, assigned agents, wallet ledger, API authorization, and SMS metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchClients}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {canCreate && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Scope Hierarchy Banner */}
      {scopeInfo.isScoped && (
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Access Scope:</strong> Logged in as <strong>{role}</strong>. Viewing clients strictly scoped to your organizational portfolio.
            </span>
          </div>
          <span className="text-[11px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
            Enforced Security Boundary
          </span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Clients</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
            {stats.total.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Active Accounts</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {stats.active.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Suspended</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
            {stats.suspended.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Assigned Numbers</span>
          <span className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
            {stats.totalNumbers.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Combined Balance</span>
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
            ${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total SMS Sent</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
            {stats.totalSmsCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, contact, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Billing:</span>
            <select
              value={billingFilter}
              onChange={(e) => {
                setBillingFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Models</option>
              <option value="PREPAID">PREPAID</option>
              <option value="POSTPAID">POSTPAID</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Client Company</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Hierarchy</th>
                <th className="py-3 px-4">Billing & Balance</th>
                <th className="py-3 px-4">Numbers</th>
                <th className="py-3 px-4">SMS Vol</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">API Access</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <span className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin inline-block mr-2" />
                    Querying clients securely...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No clients found matching the specified filters.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Client Company */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {client.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block hover:text-indigo-600 cursor-pointer" onClick={() => handleOpenDetails(client)}>
                            {client.companyName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {client.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <span className="text-slate-800 dark:text-slate-200 font-medium block">
                        {client.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {client.email}
                      </span>
                    </td>

                    {/* Hierarchy */}
                    <td className="py-3 px-4 text-[11px]">
                      <div>
                        <span className="text-slate-500">Agent: </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {client.agentName || 'Platform Direct'}
                        </span>
                      </div>
                      {client.managerName && (
                        <div className="text-slate-400 text-[10px]">
                          Mgr: {client.managerName}
                        </div>
                      )}
                    </td>

                    {/* Billing & Balance */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          ${client.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {client.currency}
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 mt-0.5 inline-block">
                        {client.billingType}
                      </span>
                    </td>

                    {/* Numbers */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-medium">
                        <Phone className="w-3 h-3" />
                        {client.assignedNumbersCount || 0}
                      </span>
                    </td>

                    {/* SMS Volume */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {client.smsStatistics?.totalSms?.toLocaleString() || 0}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          client.status === 'ACTIVE'
                            ? 'success'
                            : client.status === 'SUSPENDED'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {client.status}
                      </Badge>
                    </td>

                    {/* API Access */}
                    <td className="py-3 px-4">
                      {client.apiAccess?.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                          <Key className="w-3 h-3" />
                          <span>Active ({client.apiAccess.rateLimitPerSecond || 100}/s)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Disabled</span>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Profile */}
                        <button
                          title="View Profile & Sub-resources"
                          onClick={() => handleOpenDetails(client)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Profile */}
                        {canEdit && (
                          <button
                            title="Edit Client Information"
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* API Access Config */}
                        {canConfigureApi && (
                          <button
                            title="Configure API Access"
                            onClick={() => handleOpenApiAccess(client)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}

                        {/* Permissions Config */}
                        {canConfigurePermissions && (
                          <button
                            title="Client RBAC Permissions"
                            onClick={() => handleOpenPermissions(client)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Lifecycle Status Toggle */}
                        {canModifyStatus && (
                          <button
                            title="Toggle Lifecycle Status"
                            onClick={() => handleOpenStatus(client)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              client.status === 'ACTIVE'
                                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}

                        {/* Password Reset */}
                        {canResetPassword && (
                          <button
                            title="Reset Client Password"
                            onClick={() => handleOpenPassword(client)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {clients.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} clients
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateClientModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClientCreated={() => {
          setIsCreateOpen(false);
          fetchClients();
        }}
        currentAgentId={role === 'AGENT' ? user?.id : undefined}
      />

      <EditClientModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        client={selectedClient}
        onClientUpdated={fetchClients}
        canReassignAgent={role === 'SUPER_ADMIN' || role === 'MANAGER'}
      />

      <ClientStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        client={selectedClient}
        onStatusUpdated={fetchClients}
      />

      <ClientResetPasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        client={selectedClient}
      />

      <ClientPermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        client={selectedClient}
        onPermissionsUpdated={fetchClients}
      />

      <ClientApiAccessModal
        isOpen={isApiAccessOpen}
        onClose={() => setIsApiAccessOpen(false)}
        client={selectedClient}
        onApiUpdated={fetchClients}
      />

      <ClientDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        client={selectedClient}
      />
    </div>
  );
};
