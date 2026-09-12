import { PermissionCode, UserRole } from '../types/auth';

export const ALL_PERMISSIONS: { code: PermissionCode; module: string; description: string }[] = [
  // Users
  { code: 'users.view', module: 'IDENTITY', description: 'View user accounts and profiles' },
  { code: 'users.create', module: 'IDENTITY', description: 'Create new user accounts' },
  { code: 'users.update', module: 'IDENTITY', description: 'Update user account information' },
  { code: 'users.disable', module: 'IDENTITY', description: 'Suspend, activate, or disable user accounts' },

  // Providers
  { code: 'providers.view', module: 'PROVIDERS', description: 'View telecom providers and connections' },
  { code: 'providers.create', module: 'PROVIDERS', description: 'Configure new telecom provider gateways' },
  { code: 'providers.update', module: 'PROVIDERS', description: 'Update provider configurations and endpoints' },
  { code: 'providers.delete', module: 'PROVIDERS', description: 'Delete or deactivate provider connections' },

  // Ranges
  { code: 'ranges.view', module: 'NUMBERS', description: 'View number ranges and pools' },
  { code: 'ranges.create', module: 'NUMBERS', description: 'Create and allocate new number ranges' },
  { code: 'ranges.update', module: 'NUMBERS', description: 'Modify number range parameters' },

  // Numbers
  { code: 'numbers.view', module: 'NUMBERS', description: 'View phone numbers and status' },
  { code: 'numbers.assign', module: 'NUMBERS', description: 'Assign phone numbers to client accounts' },
  { code: 'numbers.unassign', module: 'NUMBERS', description: 'Release or unassign phone numbers' },

  // SMS & Messaging
  { code: 'sms.view', module: 'MESSAGING', description: 'View incoming SMS messages and logs' },
  { code: 'sms.export', module: 'MESSAGING', description: 'Export SMS logs and records' },

  // Reports
  { code: 'reports.view', module: 'ANALYTICS', description: 'View operational and performance reports' },

  // Billing & Finance
  { code: 'billing.view', module: 'FINANCE', description: 'View wallets, balances, and transaction history' },
  { code: 'billing.manage', module: 'FINANCE', description: 'Manage rate cards, payout rates, and credit notes' },

  // Audit
  { code: 'audit.view', module: 'SYSTEM', description: 'Inspect system-wide security and login audit trails' },

  // Settings
  { code: 'settings.manage', module: 'SYSTEM', description: 'Manage platform system configurations' },

  // API Credentials
  { code: 'api.manage', module: 'SYSTEM', description: 'Generate and revoke REST API keys' },
];

export const ROLE_HIERARCHY_WEIGHT: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  MANAGER: 3,
  AGENT: 2,
  CLIENT: 1,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.code),
  MANAGER: [
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
  AGENT: [
    'users.view',
    'numbers.view',
    'sms.view',
    'reports.view',
    'billing.view',
  ],
  CLIENT: [
    'numbers.view',
    'sms.view',
    'billing.view',
    'api.manage',
  ],
};

export class PermissionsService {
  /**
   * Retrieves all permissions assigned to a role, plus any custom user permissions.
   */
  static getPermissionsForUser(role: UserRole, customPermissions?: string[]): string[] {
    if (role === 'SUPER_ADMIN') {
      return ['*', ...ALL_PERMISSIONS.map((p) => p.code)];
    }

    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
    const merged = new Set([...defaultPerms, ...(customPermissions || [])]);
    return Array.from(merged);
  }

  /**
   * Evaluates if an effective permission set contains the required permission.
   * Super Admin has wildcard '*' access.
   */
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    if (userPermissions.includes('*')) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Evaluates role hierarchy rank.
   */
  static isAtLeastRole(userRole: UserRole, targetRole: UserRole): boolean {
    const userWeight = ROLE_HIERARCHY_WEIGHT[userRole] || 0;
    const targetWeight = ROLE_HIERARCHY_WEIGHT[targetRole] || 0;
    return userWeight >= targetWeight;
  }

  /**
   * Security guard against role escalation:
   * An actor can only create or manage users with a strictly LOWER role rank.
   * E.g. SUPER_ADMIN can manage MANAGER, AGENT, CLIENT.
   * MANAGER can only manage AGENT, CLIENT.
   * AGENT/CLIENT cannot manage any user role.
   */
  static canAssignRole(actorRole: UserRole, targetRoleToAssign: UserRole): boolean {
    const actorWeight = ROLE_HIERARCHY_WEIGHT[actorRole] || 0;
    const targetWeight = ROLE_HIERARCHY_WEIGHT[targetRoleToAssign] || 0;

    // Only SUPER_ADMIN can assign MANAGER or SUPER_ADMIN
    if (actorRole === 'SUPER_ADMIN') {
      return true;
    }

    // Actors cannot assign equal or higher roles
    return actorWeight > targetWeight;
  }

  /**
   * Checks if an actor is allowed to modify another user based on role hierarchy.
   */
  static canModifyUser(actorRole: UserRole, targetUserRole: UserRole): boolean {
    if (actorRole === 'SUPER_ADMIN') return true;
    const actorWeight = ROLE_HIERARCHY_WEIGHT[actorRole] || 0;
    const targetWeight = ROLE_HIERARCHY_WEIGHT[targetUserRole] || 0;
    return actorWeight > targetWeight;
  }
}
