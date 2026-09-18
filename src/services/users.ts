import { apiClient } from './api';
import {
  UserItem,
  UserFilterState,
  CreateUserPayload,
  RoleDefinition,
  PermissionGroup,
  UserStatus,
} from '../types/users';
import { UserRole } from '../types/auth';

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: 'IDENTITY',
    displayName: 'Management & Identity',
    description: 'User provisioning, administrative profiles, and role management',
    permissions: [
      { code: 'users.view', name: 'View Users', description: 'Inspect user list and identity profiles' },
      { code: 'users.create', name: 'Create Users', description: 'Provision new accounts with role assignments' },
      { code: 'users.update', name: 'Update Users', description: 'Modify user profiles and contact info' },
      { code: 'users.disable', name: 'Change Status', description: 'Suspend, activate, or disable accounts' },
    ],
  },
  {
    module: 'NUMBERS',
    displayName: 'Telecom & Numbers',
    description: 'E.164 phone number ranges, inventories, and client lease assignments',
    permissions: [
      { code: 'ranges.view', name: 'View Ranges', description: 'Inspect telecom numbering range pools' },
      { code: 'ranges.create', name: 'Create Ranges', description: 'Allocate and provision new number ranges' },
      { code: 'ranges.update', name: 'Update Ranges', description: 'Modify existing range allocation properties' },
      { code: 'numbers.view', name: 'View Numbers', description: 'List E.164 phone numbers and allocation states' },
      { code: 'numbers.assign', name: 'Assign Numbers', description: 'Lease numbers to enterprise clients' },
      { code: 'numbers.unassign', name: 'Unassign Numbers', description: 'Release leased numbers back to pool' },
    ],
  },
  {
    module: 'PROVIDERS',
    displayName: 'Provider Gateways',
    description: 'HTTP REST webhooks and SMPP v3.4 carrier routing trunks',
    permissions: [
      { code: 'providers.view', name: 'View Gateways', description: 'Inspect carrier gateways and operational links' },
      { code: 'providers.create', name: 'Create Gateways', description: 'Configure new carrier delivery pipelines' },
      { code: 'providers.update', name: 'Update Gateways', description: 'Edit throughput caps and connection parameters' },
      { code: 'providers.delete', name: 'Delete Gateways', description: 'Decommission carrier routing trunks' },
    ],
  },
  {
    module: 'MESSAGING',
    displayName: 'SMS & Messaging',
    description: 'Real-time message traffic, inbound delivery, and CDR streams',
    permissions: [
      { code: 'sms.view', name: 'View Traffic', description: 'Inspect real-time inbound SMS stream and delivery receipts' },
      { code: 'sms.export', name: 'Export CDRs', description: 'Download message logs and Call Detail Records' },
    ],
  },
  {
    module: 'FINANCE',
    displayName: 'Financial Ledger',
    description: 'Sub-cent rate cards, prepaid wallets, commissions, and platform margin',
    permissions: [
      { code: 'billing.view', name: 'View Balances', description: 'Inspect client wallets, credit notes, and ledgers' },
      { code: 'billing.manage', name: 'Manage Rates', description: 'Configure sub-cent rates, margins, and commissions' },
    ],
  },
  {
    module: 'SYSTEM',
    displayName: 'System & Security',
    description: 'Security audit logs, REST API keys, and platform settings',
    permissions: [
      { code: 'audit.view', name: 'Audit Logs', description: 'Inspect immutable administrative security logs' },
      { code: 'settings.manage', name: 'Platform Settings', description: 'Update platform-wide system configurations' },
      { code: 'api.manage', name: 'API Credentials', description: 'Generate and revoke client REST API tokens' },
    ],
  },
  {
    module: 'ANALYTICS',
    displayName: 'Telemetry & Reports',
    description: 'Executive dashboards, delivery ratios, and traffic analytics',
    permissions: [
      { code: 'reports.view', name: 'View Analytics', description: 'Access executive telemetry and financial performance charts' },
    ],
  },
];

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'role-super-admin',
    name: 'SUPER_ADMIN',
    displayName: 'Super Administrator',
    description: 'Unrestricted root governance across all subsystems, financial ledgers, audit trails, and configurations.',
    hierarchyWeight: 4,
    userCount: 0,
    assignedPermissions: [
      'users.view', 'users.create', 'users.update', 'users.disable',
      'providers.view', 'providers.create', 'providers.update', 'providers.delete',
      'ranges.view', 'ranges.create', 'ranges.update',
      'numbers.view', 'numbers.assign', 'numbers.unassign',
      'sms.view', 'sms.export',
      'reports.view',
      'billing.view', 'billing.manage',
      'audit.view', 'settings.manage', 'api.manage',
    ],
  },
  {
    id: 'role-manager',
    name: 'MANAGER',
    displayName: 'Operations Manager',
    description: 'Operational control over carrier trunks, agent hierarchies, client allocations, and rate cards.',
    hierarchyWeight: 3,
    userCount: 0,
    assignedPermissions: [
      'users.view', 'users.create', 'users.update',
      'providers.view', 'providers.create', 'providers.update',
      'ranges.view', 'ranges.create', 'ranges.update',
      'numbers.view', 'numbers.assign', 'numbers.unassign',
      'sms.view', 'sms.export',
      'reports.view',
      'billing.view', 'billing.manage',
    ],
  },
  {
    id: 'role-agent',
    name: 'AGENT',
    displayName: 'Business Agent',
    description: 'Commercial partner managing assigned client accounts, leased inventory, and commission payouts.',
    hierarchyWeight: 2,
    userCount: 0,
    assignedPermissions: [
      'users.view',
      'numbers.view',
      'sms.view',
      'reports.view',
      'billing.view',
    ],
  },
  {
    id: 'role-client',
    name: 'CLIENT',
    displayName: 'Enterprise Client',
    description: 'End-tenant receiving inbound SMS on leased E.164 phone numbers with automated webhook delivery.',
    hierarchyWeight: 1,
    userCount: 0,
    assignedPermissions: [
      'numbers.view',
      'sms.view',
      'billing.view',
      'api.manage',
    ],
  },
];

let lastFetchedUsers: UserItem[] = [];

export class UsersService {
  /**
   * Fetches real user accounts from backend with search, role filter, status filter, and sorting.
   */
  static async fetchUsers(
    filters: Partial<UserFilterState> = {}
  ): Promise<{ users: UserItem[]; total: number }> {
    const response = await apiClient.getUsers();

    let backendUsers: any[] = [];
    if (Array.isArray(response)) {
      backendUsers = response;
    } else if (response && typeof response === 'object' && 'users' in response) {
      backendUsers = (response as any).users || [];
    }

    const items: UserItem[] = backendUsers.map((bu) => {
      const fullName = bu.name || (bu.firstName ? `${bu.firstName} ${bu.lastName || ''}`.trim() : bu.email.split('@')[0]);
      return {
        id: bu.id,
        email: bu.email,
        name: fullName,
        firstName: bu.firstName || fullName.split(' ')[0],
        lastName: bu.lastName || fullName.split(' ').slice(1).join(' '),
        status: (bu.status as UserStatus) || 'ACTIVE',
        role: bu.role || {
          id: `role-${(bu.roleName || 'CLIENT').toLowerCase()}`,
          name: bu.roleName || 'CLIENT',
          displayName: bu.roleDisplayName || bu.roleName || 'Client',
        },
        permissions: bu.permissions || bu.role?.permissions || [],
        lastLoginAt: bu.lastLoginAt || null,
        createdAt: bu.createdAt || new Date().toISOString(),
        department: bu.department || '',
        phone: bu.phone || '',
      };
    });

    lastFetchedUsers = items;

    let result = [...items];

    // Search filter
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    // Role filter
    if (filters.role && filters.role !== 'ALL') {
      result = result.filter((u) => u.role.name === filters.role);
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((u) => u.status === filters.status);
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortDir = filters.sortDir || 'desc';

    result.sort((a, b) => {
      let aVal: any = a[sortBy as keyof UserItem] ?? '';
      let bVal: any = b[sortBy as keyof UserItem] ?? '';

      if (sortBy === 'role') {
        aVal = a.role.displayName;
        bVal = b.role.displayName;
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      users: result,
      total: result.length,
    };
  }

  /**
   * Fetches single user by ID.
   */
  static async fetchUserById(id: string): Promise<UserItem | null> {
    if (lastFetchedUsers.length > 0) {
      const existing = lastFetchedUsers.find((u) => u.id === id);
      if (existing) return existing;
    }

    const { users } = await this.fetchUsers();
    return users.find((u) => u.id === id) || null;
  }

  /**
   * Creates a new user via API with role assignment.
   */
  static async createUser(payload: CreateUserPayload): Promise<UserItem> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiClient.getToken() || ''}`,
      },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        role: payload.role,
        name: payload.name,
        status: payload.status || 'ACTIVE',
      }),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || `Failed to create user (HTTP ${res.status})`);
    }

    const created = data.data?.user || data.data;
    const roleDef = ROLE_DEFINITIONS.find((r) => r.name === payload.role) || ROLE_DEFINITIONS[3];

    return {
      id: created.id,
      email: created.email,
      name: created.name || payload.name,
      firstName: created.firstName || payload.name.split(' ')[0],
      lastName: created.lastName || payload.name.split(' ').slice(1).join(' '),
      status: created.status || payload.status || 'ACTIVE',
      role: {
        id: roleDef.id,
        name: roleDef.name,
        displayName: roleDef.displayName,
      },
      permissions: created.permissions || roleDef.assignedPermissions,
      lastLoginAt: null,
      createdAt: created.createdAt || new Date().toISOString(),
      department: payload.department || '',
      phone: payload.phone || '',
    };
  }

  /**
   * Updates an existing user's status via API.
   */
  static async updateUserStatus(
    id: string,
    status: UserStatus,
    _reason?: string
  ): Promise<UserItem> {
    const res = await fetch(`/api/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiClient.getToken() || ''}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || `Failed to update user status (HTTP ${res.status})`);
    }

    const updated = data.data?.user || data.data;
    const existing = lastFetchedUsers.find((u) => u.id === id);

    return {
      id,
      email: updated?.email || existing?.email || '',
      name: updated?.name || existing?.name || '',
      firstName: updated?.firstName || existing?.firstName || '',
      lastName: updated?.lastName || existing?.lastName || '',
      status,
      role: existing?.role || { id: 'role-client', name: 'CLIENT', displayName: 'Enterprise Client' },
      permissions: existing?.permissions || [],
      lastLoginAt: existing?.lastLoginAt || null,
      createdAt: existing?.createdAt || new Date().toISOString(),
      department: existing?.department || '',
      phone: existing?.phone || '',
    };
  }

  /**
   * Returns list of canonical roles with actual user counts.
   */
  static fetchRolesWithPermissions(): RoleDefinition[] {
    return ROLE_DEFINITIONS.map((r) => ({
      ...r,
      userCount: lastFetchedUsers.filter((u) => u.role.name === r.name).length,
    }));
  }

  /**
   * Returns organized permission modules for matrix inspection.
   */
  static fetchPermissionGroups(): PermissionGroup[] {
    return PERMISSION_GROUPS;
  }
}
