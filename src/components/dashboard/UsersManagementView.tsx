import React, { useState, useEffect } from 'react';
import { SafeUser, UserRole } from '../../types/auth';
import { apiClient } from '../../services/api';
import { useAuth, SEED_ACCOUNTS } from '../../context/AuthContext';
import { Table, ColumnDef } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar } from '../ui/FilterBar';
import { Modal } from '../ui/Modal';
import { Users, Shield, UserCheck, KeyRound, Check, RefreshCw, Plus } from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const { user: currentUser, role: currentRole, switchUserRole } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.firstName && u.firstName.toLowerCase().includes(search.toLowerCase())) ||
      (u.lastName && u.lastName.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role.name === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'info';
      case 'MANAGER':
        return 'success';
      case 'AGENT':
        return 'warning';
      case 'CLIENT':
        return 'neutral';
    }
  };

  const columns: ColumnDef<SafeUser>[] = [
    {
      key: 'email',
      header: 'User Account',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
            {u.firstName?.[0] || u.email[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email.split('@')[0]}
            </div>
            <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
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
        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
          {u.status}
        </Badge>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions Scope',
      render: (u) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {u.permissions.includes('*') ? 'Wildcard (*)' : `${u.permissions.length} grants`}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Active',
      sortable: true,
      render: (u) => (
        <span className="text-slate-500 font-mono text-xs">
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(u);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Inspect
          </button>
        </div>
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
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Authentication & Role-Based Access Control
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Multi-tenancy hierarchy: Super Admin, Operations Managers, Agents, and Client accounts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter users by name or email..."
        filters={[
          {
            key: 'role',
            label: 'Role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: 'All Roles', value: 'ALL' },
              { label: 'Super Admin', value: 'SUPER_ADMIN' },
              { label: 'Manager', value: 'MANAGER' },
              { label: 'Agent', value: 'AGENT' },
              { label: 'Client', value: 'CLIENT' },
            ],
          },
        ]}
        totalCount={users.length}
        totalFiltered={filteredUsers.length}
      />

      {/* Users Table */}
      <Table<SafeUser>
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        onRowClick={(u) => setSelectedUser(u)}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`User: ${selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : selectedUser.email}`}
          subtitle={`User ID: ${selectedUser.id}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400">Email Address</span>
                <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                  {selectedUser.email}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-slate-400">Assigned Role</span>
                <div className="mt-0.5">
                  <Badge variant={getRoleBadgeVariant(selectedUser.role.name)} size="sm">
                    {selectedUser.role.displayName}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Permissions ({selectedUser.permissions.includes('*') ? 'Wildcard (*)' : selectedUser.permissions.length})
              </h5>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                {selectedUser.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono text-[11px] border border-blue-200 dark:border-blue-900/40"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  switchUserRole(selectedUser.role.name);
                  setSelectedUser(null);
                }}
              >
                Switch Session to this Role
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
