import { apiClient } from './api';
import {
  UserItem,
  UserFilterState,
  CreateUserPayload,
  RoleDefinition,
  PermissionGroup,
  UserStatus,
} from '../types/users';
import { UserRole, PermissionCode } from '../types/auth';

/**
 * Fictional realistic demo users adhering to privacy and safety standards.
 * Guaranteed to have zero real credentials or real user exposure.
 */
const MOCK_USERS_SEED: UserItem[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@smshub.local',
    name: 'Alexander Vance',
    firstName: 'Alexander',
    lastName: 'Vance',
    status: 'ACTIVE',
    role: {
      id: 'role-super-admin',
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
    },
    permissions: ['*'],
    lastLoginAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15m ago
    createdAt: '2026-01-10T08:00:00.000Z',
    department: 'Executive Operations',
    phone: '+1 (202) 555-0100',
  },
  {
    id: 'usr-mgr-01',
    email: 'sarah.khan@sms-telecom.io',
    name: 'Sarah Khan',
    firstName: 'Sarah',
    lastName: 'Khan',
    status: 'ACTIVE',
    role: {
      id: 'role-manager',
      name: 'MANAGER',
      displayName: 'Operations Manager',
    },
    permissions: [
      'users.view',
      'users.create',
      'users.update',
      'providers.view',
      'providers.create',
      'providers.update',
      'ranges.view',
      'ranges.create',
      'ranges.update',
      'numbers.view',
      'numbers.assign',
      'numbers.unassign',
      'sms.view',
      'sms.export',
      'reports.view',
      'billing.view',
      'billing.manage',
    ],
    lastLoginAt: new Date(Date.now() - 45 * 60000).toISOString(), // 45m ago
    createdAt: '2026-02-01T09:30:00.000Z',
    department: 'Carrier Relations',
    phone: '+44 20 7946 0912',
  },
  {
    id: 'usr-mgr-02',
    email: 'elena.rostova@sms-telecom.io',
    name: 'Elena Rostova',
    firstName: 'Elena',
    lastName: 'Rostova',
    status: 'ACTIVE',
    role: {
      id: 'role-manager',
      name: 'MANAGER',
      displayName: 'Operations Manager',
    },
    permissions: [
      'users.view',
      'users.create',
      'users.update',
      'providers.view',
      'ranges.view',
      'numbers.view',
      'numbers.assign',
      'sms.view',
      'reports.view',
      'billing.view',
    ],
    lastLoginAt: new Date(Date.now() - 3 * 3600000).toISOString(), // 3h ago
    createdAt: '2026-02-15T11:00:00.000Z',
    department: 'Network Operations (NOC)',
    phone: '+49 30 901820',
  },
  {
    id: 'usr-agt-01',
    email: 'ahmed.malik@route-messaging.net',
    name: 'Ahmed Malik',
    firstName: 'Ahmed',
    lastName: 'Malik',
    status: 'ACTIVE',
    role: {
      id: 'role-agent',
      name: 'AGENT',
      displayName: 'Business Agent',
    },
    permissions: [
      'users.view',
      'numbers.view',
      'sms.view',
      'reports.view',
      'billing.view',
    ],
    lastLoginAt: new Date(Date.now() - 6 * 3600000).toISOString(), // 6h ago
    createdAt: '2026-03-01T14:15:00.000Z',
    department: 'Enterprise Sales',
    phone: '+971 4 321 4567',
  },
  {
    id: 'usr-agt-02',
    email: 'marcus.chen@sms-telecom.io',
    name: 'Marcus Chen',
    firstName: 'Marcus',
    lastName: 'Chen',
    status: 'ACTIVE',
    role: {
      id: 'role-agent',
      name: 'AGENT',
      displayName: 'Business Agent',
    },
    permissions: [
      'users.view',
      'numbers.view',
      'sms.view',
      'reports.view',
      'billing.view',
    ],
    lastLoginAt: new Date(Date.now() - 24 * 3600000).toISOString(), // 1d ago
    createdAt: '2026-03-10T10:00:00.000Z',
    department: 'APAC Expansion',
    phone: '+65 6789 0123',
  },
  {
    id: 'usr-clt-01',
    email: 'daniel.smith@apex-enterprise.com',
    name: 'Daniel Smith',
    firstName: 'Daniel',
    lastName: 'Smith',
    status: 'ACTIVE',
    role: {
      id: 'role-client',
      name: 'CLIENT',
      displayName: 'Enterprise Client',
    },
    permissions: [
      'numbers.view',
      'sms.view',
      'billing.view',
      'api.manage',
    ],
    lastLoginAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: '2026-03-12T16:20:00.000Z',
    department: 'Apex Digital Media Inc.',
    phone: '+1 (415) 555-2671',
  },
  {
    id: 'usr-clt-02',
    email: 'olivia.wilson@nexus-fintech.org',
    name: 'Olivia Wilson',
    firstName: 'Olivia',
    lastName: 'Wilson',
    status: 'ACTIVE',
    role: {
      id: 'role-client',
      name: 'CLIENT',
      displayName: 'Enterprise Client',
    },
    permissions: [
      'numbers.view',
      'sms.view',
      'billing.view',
      'api.manage',
    ],
    lastLoginAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    createdAt: '2026-03-14T09:45:00.000Z',
    department: 'Nexus Fintech Corp',
    phone: '+44 20 7123 4567',
  },
  {
    id: 'usr-clt-03',
    email: 'layla.m@gulf-retail.ae',
    name: 'Layla Al-Mansoor',
    firstName: 'Layla',
    lastName: 'Al-Mansoor',
    status: 'PENDING',
    role: {
      id: 'role-client',
      name: 'CLIENT',
      displayName: 'Enterprise Client',
    },
    permissions: [
      'numbers.view',
      'sms.view',
      'billing.view',
    ],
    lastLoginAt: null,
    createdAt: '2026-03-15T18:30:00.000Z',
    department: 'Gulf Retail Group',
    phone: '+971 50 123 9876',
  },
  {
    id: 'usr-clt-04',
    email: 'thomas.d@paris-logistics.fr',
    name: 'Thomas Dubois',
    firstName: 'Thomas',
    lastName: 'Dubois',
    status: 'SUSPENDED',
    role: {
      id: 'role-client',
      name: 'CLIENT',
      displayName: 'Enterprise Client',
    },
    permissions: [
      'numbers.view',
      'sms.view',
      'billing.view',
    ],
    lastLoginAt: new Date(Date.now() - 72 * 3600000).toISOString(), // 3d ago
    createdAt: '2026-02-20T12:00:00.000Z',
    department: 'Paris Global Logistics',
    phone: '+33 1 42 68 55 00',
  },
];

// In-memory runtime state for mutations when backend database is pre-migration
let inMemoryUsers: UserItem[] = [...MOCK_USERS_SEED];

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
    userCount: 1,
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
    userCount: 2,
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
    userCount: 2,
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
    userCount: 4,
    assignedPermissions: [
      'numbers.view',
      'sms.view',
      'billing.view',
      'api.manage',
    ],
  },
];

export class UsersService {
  /**
   * Fetches user accounts with search, role filter, status filter, and sorting.
   */
  static async fetchUsers(
    filters: Partial<UserFilterState> = {}
  ): Promise<{ users: UserItem[]; total: number }> {
    try {
      const response = await apiClient.getUsers();
      // Handle potential wrapped response { users: SafeUser[], count: number }
      let backendUsers: any[] = [];
      if (Array.isArray(response)) {
        backendUsers = response;
      } else if (response && typeof response === 'object' && 'users' in response) {
        backendUsers = (response as any).users || [];
      }

      if (backendUsers.length > 0) {
        // Merge or sync with inMemoryUsers to preserve full names and realistic metadata
        inMemoryUsers = backendUsers.map((bu) => {
          const existing = inMemoryUsers.find((mu) => mu.id === bu.id || mu.email === bu.email);
          const fullName = bu.name || (bu.firstName ? `${bu.firstName} ${bu.lastName || ''}`.trim() : bu.email.split('@')[0]);
          return {
            id: bu.id,
            email: bu.email,
            name: fullName,
            firstName: bu.firstName || existing?.firstName || fullName.split(' ')[0],
            lastName: bu.lastName || existing?.lastName || fullName.split(' ').slice(1).join(' '),
            status: (bu.status as UserStatus) || existing?.status || 'ACTIVE',
            role: bu.role || existing?.role || {
              id: 'role-client',
              name: 'CLIENT',
              displayName: 'Enterprise Client',
            },
            permissions: bu.permissions || existing?.permissions || ['numbers.view', 'sms.view'],
            lastLoginAt: bu.lastLoginAt || existing?.lastLoginAt || null,
            createdAt: bu.createdAt || existing?.createdAt || new Date().toISOString(),
            department: existing?.department || 'Operations',
            phone: existing?.phone || '+1 (555) 000-0000',
          };
        });
      }
    } catch {
      // Backend gracefully falls back to inMemoryUsers
    }

    let result = [...inMemoryUsers];

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
    const user = inMemoryUsers.find((u) => u.id === id);
    return user || null;
  }

  /**
   * Creates a new user with validation and role assignment.
   */
  static async createUser(payload: CreateUserPayload): Promise<UserItem> {
    const roleDef = ROLE_DEFINITIONS.find((r) => r.name === payload.role) || ROLE_DEFINITIONS[3];

    const newUser: UserItem = {
      id: `usr-${Date.now().toString(36)}`,
      email: payload.email.toLowerCase().trim(),
      name: payload.name.trim(),
      firstName: payload.name.split(' ')[0] || payload.name,
      lastName: payload.name.split(' ').slice(1).join(' ') || '',
      status: payload.status || 'ACTIVE',
      role: {
        id: roleDef.id,
        name: roleDef.name,
        displayName: roleDef.displayName,
      },
      permissions: roleDef.assignedPermissions,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      department: payload.department || 'General',
      phone: payload.phone || '',
    };

    inMemoryUsers = [newUser, ...inMemoryUsers];

    // Attempt backend POST if available
    try {
      await fetch('/api/users', {
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
    } catch {
      // Retain in memory
    }

    return newUser;
  }

  /**
   * Updates an existing user's lifecycle status (ACTIVE, SUSPENDED, PENDING, DISABLED).
   */
  static async updateUserStatus(
    id: string,
    status: UserStatus,
    _reason?: string
  ): Promise<UserItem> {
    const index = inMemoryUsers.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...inMemoryUsers[index],
      status,
    };

    inMemoryUsers[index] = updatedUser;

    // Attempt backend PATCH if available
    try {
      await fetch(`/api/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiClient.getToken() || ''}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Retain in memory
    }

    return updatedUser;
  }

  /**
   * Returns list of canonical roles with assigned permissions.
   */
  static fetchRolesWithPermissions(): RoleDefinition[] {
    // Recalculate live userCount from in-memory records
    return ROLE_DEFINITIONS.map((r) => ({
      ...r,
      userCount: inMemoryUsers.filter((u) => u.role.name === r.name).length,
    }));
  }

  /**
   * Returns organized permission modules for matrix inspection.
   */
  static fetchPermissionGroups(): PermissionGroup[] {
    return PERMISSION_GROUPS;
  }
}
