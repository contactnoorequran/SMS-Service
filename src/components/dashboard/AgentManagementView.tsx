import React, { useState, useEffect, useCallback } from 'react';
import {
  AgentListItem,
  AgentDetail,
  CreateAgentDTO,
  UpdateAgentDTO,
} from '../../types/agent';
import { ManagerListItem } from '../../types/manager';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { CreateAgentModal } from './agents/CreateAgentModal';
import { EditAgentModal } from './agents/EditAgentModal';
import { AgentStatusModal } from './agents/AgentStatusModal';
import { AgentResetPasswordModal } from './agents/AgentResetPasswordModal';
import { AgentPermissionsModal } from './agents/AgentPermissionsModal';
import { AssignManagerModal } from './agents/AssignManagerModal';
import { AgentDetailsModal } from './agents/AgentDetailsModal';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Filter,
  Eye,
  Edit2,
  Power,
  KeyRound,
  ShieldCheck,
  Building,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Hash,
  MessageSquare,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const AgentManagementView: React.FC = () => {
  const { user, role } = useAuth();

  // State for listing and pagination
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    totalClients: number;
    totalNumbers: number;
    totalEarnings: number;
    totalSms: number;
  }>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    totalClients: 0,
    totalNumbers: 0,
    totalEarnings: 0,
    totalSms: 0,
  });

  const [scopeInfo, setScopeInfo] = useState<{
    actorRole: string;
    isScopedToManager: boolean;
    managerName?: string;
    managerId?: string;
  }>({
    actorRole: role,
    isScopedToManager: role === 'MANAGER',
  });

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [managerFilter, setManagerFilter] = useState<string>('ALL');
  const [managers, setManagers] = useState<ManagerListItem[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Selected agent for modals
  const [selectedAgent, setSelectedAgent] = useState<AgentListItem | null>(null);
  const [detailedAgent, setDetailedAgent] = useState<AgentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Modal visibility states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState<boolean>(false);
  const [isAssignManagerOpen, setIsAssignManagerOpen] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch agents list
  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAgents({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        managerId: managerFilter !== 'ALL' ? managerFilter : undefined,
        page,
        limit,
      });

      setAgents(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.scopeInfo) {
        setScopeInfo(data.scopeInfo);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve agent records.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, managerFilter, page, limit]);

  // Initial metadata fetch
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [mgrsRes, permsRes] = await Promise.all([
          apiClient.getManagers({ limit: 100 }).catch(() => ({ items: [] })),
          apiClient.getAvailablePermissions().catch(() => []),
        ]);
        setManagers(mgrsRes.items || []);
        setAvailablePermissions(permsRes || []);
      } catch {
        // graceful fallback
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Handler: Create Agent
  const handleCreateAgent = async (data: CreateAgentDTO) => {
    const res = await apiClient.createAgent(data);
    await fetchAgents();
    showToast(`Agent ${data.firstName} ${data.lastName} successfully created.`);
    return res;
  };

  // Handler: Edit Agent
  const handleEditAgent = async (id: string, data: UpdateAgentDTO) => {
    await apiClient.updateAgent(id, data);
    await fetchAgents();
    showToast('Agent profile updated successfully.');
  };

  // Handler: Status Change (Enable / Disable)
  const handleStatusChange = async (id: string, status: 'ACTIVE' | 'SUSPENDED', reason: string) => {
    await apiClient.updateAgentStatus(id, status, reason);
    await fetchAgents();
    showToast(`Agent status set to ${status}.`);
  };

  // Handler: Password Reset
  const handleResetPassword = async (
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ) => {
    const res = await apiClient.resetAgentPassword(id, options);
    showToast('Password reset executed.');
    return res;
  };

  // Handler: Assign Permissions
  const handleUpdatePermissions = async (id: string, perms: string[]) => {
    await apiClient.updateAgentPermissions(id, perms);
    await fetchAgents();
    showToast('Agent permissions updated successfully.');
  };

  // Handler: Assign Agent to Manager
  const handleAssignManager = async (id: string, managerId: string | null) => {
    await apiClient.assignAgentManager(id, managerId);
    await fetchAgents();
    showToast('Agent manager assignment updated.');
  };

  // Handler: Open Details Modal
  const handleOpenDetails = async (agent: AgentListItem) => {
    setSelectedAgent(agent);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    try {
      const detail = await apiClient.getAgentById(agent.id);
      setDetailedAgent(detail);
    } catch (err: any) {
      showToast(err.message || 'Failed to load agent details', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">SUSPENDED</Badge>;
      case 'INACTIVE':
      default:
        return <Badge variant="neutral">INACTIVE</Badge>;
    }
  };

  const isManagerOrAdmin = role === 'SUPER_ADMIN' || role === 'MANAGER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
              Phase 06 • Agent Management
            </span>
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {scopeInfo.isScopedToManager
                ? `Manager Scope: ${scopeInfo.managerName || 'Assigned Scope'}`
                : role === 'AGENT'
                ? 'Agent Personal Dossier'
                : 'Super Admin Unrestricted Global Scope'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Agent Directory & Operations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {role === 'SUPER_ADMIN'
              ? 'Supervise and control all commercial agents, assign agents to managers, review statistics, number inventories, and client relationships.'
              : role === 'MANAGER'
              ? `Manage and monitor agents within your assigned managerial portfolio (${scopeInfo.managerName || 'Your Department'}).`
              : 'Inspect your active client assignments, leased numbers, commission earnings, and operational telemetry.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchAgents}
            disabled={isLoading}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Agent</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Agents
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
            <Users className="w-5 h-5 text-blue-600" />
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In authorized scope</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Agents
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {stats.active}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.suspended} suspended • {stats.inactive} inactive
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Managed Clients
          </div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
            <Building className="w-5 h-5 text-indigo-500" />
            {stats.totalClients}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active customer orgs</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Allocated Numbers
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
            <Hash className="w-5 h-5 text-amber-500" />
            {stats.totalNumbers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dedicated DID pools</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            SMS Volume
          </div>
          <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            {stats.totalSms.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Processed messages</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Earnings
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            ${stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cumulative commission</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by agent name, username, email, phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>

            {/* Manager Filter (Super Admin only) */}
            {isSuperAdmin && (
              <select
                value={managerFilter}
                onChange={(e) => {
                  setManagerFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 max-w-48 truncate"
              >
                <option value="ALL">All Managers</option>
                <option value="UNASSIGNED">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {(search || statusFilter !== 'ALL' || managerFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setManagerFilter('ALL');
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agents Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading agent profiles and hierarchy mappings...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-500 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        ) : agents.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            No agents found matching your query or current access scope.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Agent Name & Username</th>
                  <th className="px-4 py-3">Assigned Manager</th>
                  <th className="px-4 py-3 text-center">Commission</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Clients</th>
                  <th className="px-4 py-3 text-center">Numbers</th>
                  <th className="px-4 py-3 text-right">Earnings</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Agent Name & Email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-900/60 shrink-0">
                          {agent.firstName[0]}
                          {agent.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {agent.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            @{agent.username} • {agent.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Manager */}
                    <td className="px-4 py-3">
                      {agent.managerName ? (
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-blue-500" />
                            {agent.managerName}
                          </div>
                          <div className="text-[10px] text-slate-400">{agent.department || 'Operations'}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned (Direct)</span>
                      )}
                    </td>

                    {/* Commission */}
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-[11px] font-bold">
                        {(agent.commissionRate * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">{getStatusBadge(agent.status)}</td>

                    {/* Clients Count */}
                    <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {agent.clientsCount}
                    </td>

                    {/* Numbers Count */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {agent.assignedNumbersCount}
                      </span>
                      {agent.unassignedNumbersCount > 0 && (
                        <span className="text-[10px] text-slate-400 ml-1">
                          (+{agent.unassignedNumbersCount})
                        </span>
                      )}
                    </td>

                    {/* Earnings */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${agent.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => handleOpenDetails(agent)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          title="View Agent Details, Statistics & Clients"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Agent (Super Admin / Manager) */}
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                            title="Edit Agent Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reassign Manager (Super Admin only) */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsAssignManagerOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
                            title="Assign to Manager"
                          >
                            <Building className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reset Password */}
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsResetOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}

                        {/* Permissions */}
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsPermissionsOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
                            title="Assign Permissions"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Status Toggle (Enable / Disable) */}
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setTargetStatus(agent.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                              setIsStatusOpen(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              agent.status === 'ACTIVE'
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                            title={agent.status === 'ACTIVE' ? 'Suspend Agent' : 'Activate Agent'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold">{agents.length}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> agents
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isCreateOpen && (
        <CreateAgentModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateAgent}
          managers={managers}
          currentRole={role}
        />
      )}

      {isEditOpen && selectedAgent && (
        <EditAgentModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          onSubmit={handleEditAgent}
          managers={managers}
          currentRole={role}
        />
      )}

      {isStatusOpen && selectedAgent && (
        <AgentStatusModal
          isOpen={isStatusOpen}
          onClose={() => {
            setIsStatusOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          targetStatus={targetStatus}
          onSubmit={handleStatusChange}
        />
      )}

      {isResetOpen && selectedAgent && (
        <AgentResetPasswordModal
          isOpen={isResetOpen}
          onClose={() => {
            setIsResetOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          onSubmit={handleResetPassword}
        />
      )}

      {isPermissionsOpen && selectedAgent && (
        <AgentPermissionsModal
          isOpen={isPermissionsOpen}
          onClose={() => {
            setIsPermissionsOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          availablePermissions={availablePermissions}
          onSubmit={handleUpdatePermissions}
        />
      )}

      {isAssignManagerOpen && selectedAgent && (
        <AssignManagerModal
          isOpen={isAssignManagerOpen}
          onClose={() => {
            setIsAssignManagerOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          managers={managers}
          onSubmit={handleAssignManager}
        />
      )}

      {isDetailOpen && selectedAgent && (
        <AgentDetailsModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedAgent(null);
            setDetailedAgent(null);
          }}
          agent={detailedAgent}
          isLoading={isLoadingDetail}
        />
      )}
    </div>
  );
};
