import React, { useState, useEffect, useCallback } from 'react';
import {
  ManagerListItem,
  ManagerDetail,
  CreateManagerDTO,
  UpdateManagerDTO,
  PermissionDefinition,
} from '../../types/manager';
import { apiClient } from '../../services/api';
import { Badge } from '../ui/Badge';
import { CreateManagerModal } from './managers/CreateManagerModal';
import { EditManagerModal } from './managers/EditManagerModal';
import { StatusChangeModal } from './managers/StatusChangeModal';
import { ResetPasswordModal } from './managers/ResetPasswordModal';
import { PermissionsModal } from './managers/PermissionsModal';
import { ManagerDetailsModal } from './managers/ManagerDetailsModal';
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
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  UserCheck,
} from 'lucide-react';

export const ManagerManagementView: React.FC = () => {
  // State for listing and pagination
  const [managers, setManagers] = useState<ManagerListItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    suspended: number;
    pending: number;
    totalAgentsManaged: number;
    totalClientsManaged: number;
  }>({
    total: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    totalAgentsManaged: 0,
    totalClientsManaged: 0,
  });

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [departments, setDepartments] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDefinition[]>([]);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Modal active manager tracking
  const [selectedManager, setSelectedManager] = useState<ManagerListItem | null>(null);
  const [detailedManager, setDetailedManager] = useState<ManagerDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Modal visibility states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch managers list
  const fetchManagers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getManagers({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        page,
        limit,
      });

      setManagers(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve manager records.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, departmentFilter, page, limit]);

  // Initial metadata fetch
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptList, permList] = await Promise.all([
          apiClient.getManagerDepartments().catch(() => []),
          apiClient.getAvailablePermissions().catch(() => []),
        ]);
        setDepartments(deptList);
        setAvailablePermissions(permList);
      } catch {
        // graceful fallback
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  // Handler: Create Manager
  const handleCreateManager = async (data: CreateManagerDTO) => {
    const res = await apiClient.createManager(data);
    await fetchManagers();
    showToast(`Manager ${data.firstName} ${data.lastName} successfully created.`);
    return res;
  };

  // Handler: Edit Manager
  const handleEditManager = async (id: string, data: UpdateManagerDTO) => {
    await apiClient.updateManager(id, data);
    await fetchManagers();
    showToast('Manager profile updated successfully.');
  };

  // Handler: Status Change (Enable / Disable)
  const handleStatusChange = async (id: string, status: 'ACTIVE' | 'SUSPENDED', reason: string) => {
    await apiClient.updateManagerStatus(id, status, reason);
    await fetchManagers();
    showToast(`Manager status set to ${status}.`);
  };

  // Handler: Password Reset
  const handleResetPassword = async (
    id: string,
    options: { newPassword?: string; autoGenerate?: boolean }
  ) => {
    const res = await apiClient.resetManagerPassword(id, options);
    showToast('Password reset executed.');
    return res;
  };

  // Handler: Assign Permissions
  const handleUpdatePermissions = async (id: string, perms: string[]) => {
    await apiClient.updateManagerPermissions(id, perms);
    await fetchManagers();
    showToast('Manager permissions updated successfully.');
  };

  // Handler: Open Details Modal
  const handleOpenDetails = async (manager: ManagerListItem) => {
    setSelectedManager(manager);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    try {
      const detail = await apiClient.getManagerById(manager.id);
      setDetailedManager(detail);
    } catch (err: any) {
      showToast(err.message || 'Failed to load manager details', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

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
              Phase 05 • Manager Management
            </span>
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Super Admin Authorized
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Manager Directory & Hierarchy
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create, manage, and supervise departmental managers, inspect allocated agents and client portfolios, configure granular permissions, and control security access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchManagers}
            disabled={isLoading}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Manager
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-500">Total Managers</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Active Status</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.active}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Suspended</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {stats.suspended}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Pending Setup</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.pending}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-500">Agents Managed</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.totalAgentsManaged}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-500">Clients Portfolio</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.totalClientsManaged}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by manager name, username, email, contact, or department..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
            <option value="PENDING">Pending Only</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
                setPage(1);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Querying manager records and hierarchy stats...</p>
          </div>
        ) : managers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No Managers Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                ? 'No managers match the current search filters. Try clearing filters or searching another term.'
                : 'No managers have been provisioned yet. Click "Add New Manager" to create the first manager profile.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Manager Profile</th>
                  <th className="px-4 py-3.5">Contact & Email</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Hierarchy Allocation</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Super Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {managers.map((mgr) => (
                  <tr
                    key={mgr.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Manager Name & Username */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                          {mgr.firstName?.[0] || 'M'}
                          {mgr.lastName?.[0] || 'G'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {mgr.name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            @{mgr.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Email */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {mgr.email}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{mgr.contact}</div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {mgr.department}
                      </span>
                    </td>

                    {/* Allocation */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-[11px] font-semibold">
                          {mgr.agentsCount} / {mgr.maxAgents} Agents
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 text-[11px] font-semibold">
                          {mgr.clientsCount} Clients
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          mgr.status === 'ACTIVE'
                            ? 'success'
                            : mgr.status === 'SUSPENDED'
                            ? 'error'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {mgr.status}
                      </Badge>
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {mgr.lastLoginAt ? new Date(mgr.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>

                    {/* Quick Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => handleOpenDetails(mgr)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Full Profile & Hierarchy"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Profile */}
                        <button
                          onClick={() => {
                            setSelectedManager(mgr);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Toggle (Enable/Disable) */}
                        <button
                          onClick={() => {
                            setSelectedManager(mgr);
                            setTargetStatus(mgr.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                            setIsStatusOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            mgr.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                          }`}
                          title={mgr.status === 'ACTIVE' ? 'Suspend Manager' : 'Reactivate Manager'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setSelectedManager(mgr);
                            setIsResetOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Reset Password Securely"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Assign Permissions */}
                        <button
                          onClick={() => {
                            setSelectedManager(mgr);
                            setIsPermissionsOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Configure Permissions"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{managers.length}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> managers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-slate-600 dark:text-slate-400 font-medium px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateManagerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateManager}
        departments={departments}
      />

      <EditManagerModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedManager(null);
        }}
        manager={selectedManager}
        onSubmit={handleEditManager}
        departments={departments}
      />

      <StatusChangeModal
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setSelectedManager(null);
        }}
        manager={selectedManager}
        targetStatus={targetStatus}
        onSubmit={handleStatusChange}
      />

      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => {
          setIsResetOpen(false);
          setSelectedManager(null);
        }}
        manager={selectedManager}
        onSubmit={handleResetPassword}
      />

      <PermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => {
          setIsPermissionsOpen(false);
          setSelectedManager(null);
        }}
        manager={selectedManager}
        availablePermissions={availablePermissions}
        onSubmit={handleUpdatePermissions}
      />

      <ManagerDetailsModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedManager(null);
          setDetailedManager(null);
        }}
        manager={detailedManager}
        isLoading={isLoadingDetail}
      />
    </div>
  );
};
