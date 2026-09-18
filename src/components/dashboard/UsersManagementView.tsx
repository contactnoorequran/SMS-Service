import React, { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { UserItem, UsersSortField, UserStatus } from '../../types/users';
import { UserRole } from '../../types/auth';
import { StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar } from '../ui/FilterBar';
import { Table, ColumnDef } from '../ui/Table';
import { Pagination } from '../ui/Pagination';
import { StatCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { NotFoundState } from '../system/NotFoundState';
import { PageHeader } from '../ui/PageHeader';
import { MoreActionsMenu } from '../ui/MoreActionsMenu';
import { CreateUserModal } from './users/CreateUserModal';
import { UserStatusModal } from './users/UserStatusModal';
import { UserDetailsView } from './users/UserDetailsView';
import { RoleManagementView } from './users/RoleManagementView';
import { formatNumber, formatRelativeTime, formatDate } from '../../utils/formatters';
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  ShieldAlert,
  Clock,
  RefreshCw,
  Eye,
  Power,
  ChevronRight,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const {
    users,
    allUsers,
    totalCount,
    filteredCount,
    kpis,
    filterState,
    updateFilter,
    resetFilters,
    isLoading,
    isRefreshing,
    error,
    selectedUserId,
    selectedUser,
    isLoadingDetail,
    selectUser,
    clearSelectedUser,
    refresh,
    createUser,
    updateUserStatus,
  } = useUsers();

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusModalState, setStatusModalState] = useState<{
    isOpen: boolean;
    user: UserItem | null;
    targetStatus: UserStatus | null;
  }>({
    isOpen: false,
    user: null,
    targetStatus: null,
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'info';
      case 'MANAGER':
        return 'success';
      case 'AGENT':
        return 'purple';
      case 'CLIENT':
        return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'SUSPENDED':
      case 'DISABLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const handleOpenStatusModal = (user: UserItem) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStatusModalState({
      isOpen: true,
      user,
      targetStatus: nextStatus,
    });
  };

  const handleStatusConfirmed = async (id: string, newStatus: UserStatus, reason?: string) => {
    try {
      await updateUserStatus(id, newStatus, reason);
      showToast(`Account status updated to ${newStatus} successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      showToast(msg, 'error');
    }
  };

  const handleCreateUserSubmit = async (payload: any) => {
    try {
      const created = await createUser(payload);
      showToast(`User ${created.name} (${created.email}) created successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      showToast(msg, 'error');
      throw err;
    }
  };

  // If a user detail view is active (/users/:id)
  if (selectedUserId) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-4">
            <button
              onClick={clearSelectedUser}
              className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Users
            </button>
            <span>/</span>
            <span>Loading user...</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
        </div>
      );
    }

    if (selectedUser) {
      return (
        <UserDetailsView
          user={selectedUser}
          onBack={clearSelectedUser}
          onRequestStatusChange={(u, target) =>
            setStatusModalState({
              isOpen: true,
              user: u,
              targetStatus: target,
            })
          }
        />
      );
    }

    // Invalid / missing user ID route (e.g. /users/invalid)
    return (
      <NotFoundState
        title="User Account Not Found"
        resourceName="User Account"
        resourceId={selectedUserId}
        onBack={clearSelectedUser}
      />
    );
  }

  // Full-page error state when no data could be loaded
  if (error && allUsers.length === 0) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to load Users & RBAC Directory"
          message="Could not retrieve platform identity telemetry. Please check backend connection or retry."
          error={error}
          onRetry={refresh}
        />
      </div>
    );
  }

  // Paginated slice for current page view
  const pageSize = filterState.limit;
  const startIndex = (filterState.page - 1) * pageSize;
  const paginatedUsers = users.slice(startIndex, startIndex + pageSize);

  const columns: ColumnDef<UserItem>[] = [
    {
      key: 'name',
      header: 'User Identity',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div className="w-8 h-8 rounded-lg bg-[var(--glass-bg-active)] text-[var(--accent-blue)] font-bold flex items-center justify-center text-xs shrink-0 border border-[rgba(59,130,246,0.15)]">
            {u.name[0] || u.email[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[var(--text-primary)] truncate flex items-center gap-1.5">
              <span>{u.name}</span>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-tertiary)] truncate">
              {u.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role Profile',
      sortable: true,
      render: (u) => (
        <Badge variant={getRoleBadgeVariant(u.role.name)} size="sm">
          <Shield className="w-3 h-3 mr-1 inline" />
          <span>{u.role.displayName}</span>
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u) => (
        <Badge variant={getStatusBadgeVariant(u.status)} size="sm">
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${
              u.status === 'ACTIVE'
                ? 'bg-[var(--accent-emerald)] animate-pulse-dot'
                : u.status === 'PENDING'
                ? 'bg-[var(--accent-amber)]'
                : 'bg-[var(--accent-rose)]'
            }`}
          />
          <span>{u.status}</span>
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (u) => (
        <span className="text-[var(--text-secondary)] font-mono text-xs">
          {formatDate(u.createdAt)}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Active',
      sortable: true,
      render: (u) => (
        <span className="text-[var(--text-secondary)] font-mono text-xs">
          {u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : 'Never logged in'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <MoreActionsMenu
            ariaLabel={`Actions for ${u.name}`}
            items={[
              {
                id: 'view',
                label: 'View Profile & Permissions',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: () => selectUser(u.id),
              },
              {
                id: 'roles',
                label: 'Manage Roles',
                icon: <Shield className="w-3.5 h-3.5" />,
                onClick: () => {
                  selectUser(u.id);
                  setActiveTab('roles');
                },
              },
              {
                id: 'status',
                label: u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account',
                icon: <Power className="w-3.5 h-3.5" />,
                isDangerous: u.status === 'ACTIVE',
                confirmTitle: `Suspend User ${u.name}`,
                confirmMessage: `Are you sure you want to suspend user account ${u.email}? They will be logged out and unable to access the platform.`,
                onClick: () => handleOpenStatusModal(u),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-[var(--accent-emerald-dim)] border-[rgba(16,185,129,0.3)] text-[var(--accent-emerald)]'
              : 'bg-[var(--accent-rose-dim)] border-[rgba(244,63,94,0.3)] text-[var(--accent-rose)]'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[11px] underline ml-3 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Standard Page Header Pattern */}
      <PageHeader
        title="Users & RBAC Management"
        description="Manage enterprise identities, administrative roles, granular permission scopes, and account security statuses."
        breadcrumbs={[{ label: 'Management' }, { label: 'Users' }]}
        primaryAction={{
          label: 'Create User',
          onClick: () => setIsCreateModalOpen(true),
          icon: <UserPlus className="w-3.5 h-3.5" />,
          id: 'btn-create-user',
        }}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading || isRefreshing}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            aria-label="Refresh users directory"
          >
            Refresh
          </Button>
        }
      >
        {/* Sub-Tab Switcher inside Header */}
        <div className="flex items-center gap-1 bg-[var(--glass-bg-active)] p-1 rounded-lg text-xs w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-[var(--glass-bg)] text-[var(--text-primary)] shadow-xs font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users Directory</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'bg-[var(--glass-bg)] text-[var(--text-primary)] shadow-xs font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Roles & Permissions</span>
          </button>
        </div>
      </PageHeader>

      {/* Render sub-tab content: Roles & Matrix vs. Users Directory */}
      {activeTab === 'roles' ? (
        <RoleManagementView />
      ) : (
        <>
          {/* 2. KPI Summary Cards */}
          {isLoading && allUsers.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                id="stat-total-users"
                title="Total Users"
                value={formatNumber(kpis.totalUsers)}
                subtitle="All provisioned accounts"
                icon={<Users className="w-5 h-5" />}
                iconBgColor="bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]"
                badge={<Badge variant="info" size="sm">Directory</Badge>}
              />

              <StatCard
                id="stat-active-users"
                title="Active Users"
                value={formatNumber(kpis.activeUsers)}
                subtitle="Authorized platform sessions"
                icon={<UserCheck className="w-5 h-5" />}
                iconBgColor="bg-[var(--accent-emerald-dim)] text-[var(--accent-emerald)]"
                badge={<Badge variant="success" size="sm">Active</Badge>}
              />

              <StatCard
                id="stat-pending-users"
                title="Pending Users"
                value={formatNumber(kpis.pendingUsers)}
                subtitle="Awaiting administrative review"
                icon={<Clock className="w-5 h-5" />}
                iconBgColor="bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]"
                badge={<Badge variant="warning" size="sm">Pending</Badge>}
              />

              <StatCard
                id="stat-suspended-users"
                title="Suspended Users"
                value={formatNumber(kpis.suspendedUsers)}
                subtitle="Deactivated or blocked"
                icon={<ShieldAlert className="w-5 h-5" />}
                iconBgColor="bg-[var(--accent-rose-dim)] text-[var(--accent-rose)]"
                badge={<Badge variant="error" size="sm">Suspended</Badge>}
              />
            </div>
          )}

          {/* 3. Filters and Search Bar */}
          <FilterBar
            searchValue={filterState.search}
            onSearchChange={(v) => updateFilter('search', v)}
            searchPlaceholder="Search users by name, email, or department..."
            filters={[
              {
                key: 'role',
                label: 'Role Profile',
                value: filterState.role,
                onChange: (v) => updateFilter('role', v),
                options: [
                  { label: 'All Roles', value: 'ALL' },
                  { label: 'Super Admin', value: 'SUPER_ADMIN' },
                  { label: 'Manager', value: 'MANAGER' },
                  { label: 'Agent', value: 'AGENT' },
                  { label: 'Client', value: 'CLIENT' },
                ],
              },
              {
                key: 'status',
                label: 'Account Status',
                value: filterState.status,
                onChange: (v) => updateFilter('status', v),
                options: [
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Suspended', value: 'SUSPENDED' },
                ],
              },
            ]}
            onReset={resetFilters}
            totalCount={totalCount}
            totalFiltered={filteredCount}
          />

          {/* 4. Users Table & Pagination */}
          {users.length === 0 && !isLoading ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No users found"
              description="No user accounts matched the current search or filter criteria. Try clearing filters or create a new user."
              actionText="Reset Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl overflow-hidden shadow-xs">
              <Table<UserItem>
                columns={columns}
                data={paginatedUsers}
                keyExtractor={(u) => u.id}
                isLoading={isLoading}
                sortKey={filterState.sortBy}
                sortDirection={filterState.sortDir}
                onSort={(key) => {
                  const sortKey = key as UsersSortField;
                  if (filterState.sortBy === sortKey) {
                    updateFilter('sortDir', filterState.sortDir === 'asc' ? 'desc' : 'asc');
                  } else {
                    updateFilter('sortBy', sortKey);
                    updateFilter('sortDir', 'asc');
                  }
                }}
                onRowClick={(u) => selectUser(u.id)}
              />

              {/* Table Pagination */}
              {totalCount > 0 && (
                <Pagination
                  currentPage={filterState.page}
                  totalItems={filteredCount}
                  pageSize={filterState.limit}
                  onPageChange={(p) => updateFilter('page', p)}
                  onPageSizeChange={(sz) => updateFilter('limit', sz)}
                  pageSizeOptions={[5, 10, 20]}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUserSubmit}
      />

      {/* User Status Confirmation Modal */}
      <UserStatusModal
        isOpen={statusModalState.isOpen}
        user={statusModalState.user}
        targetStatus={statusModalState.targetStatus}
        onClose={() => setStatusModalState({ isOpen: false, user: null, targetStatus: null })}
        onConfirm={handleStatusConfirmed}
      />
    </div>
  );
};
