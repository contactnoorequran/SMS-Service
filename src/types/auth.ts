export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export type PermissionCode =
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.disable'
  | 'providers.view'
  | 'providers.create'
  | 'providers.update'
  | 'providers.delete'
  | 'ranges.view'
  | 'ranges.create'
  | 'ranges.update'
  | 'numbers.view'
  | 'numbers.assign'
  | 'numbers.unassign'
  | 'sms.view'
  | 'sms.export'
  | 'reports.view'
  | 'billing.view'
  | 'billing.manage'
  | 'audit.view'
  | 'settings.manage'
  | 'api.manage';

export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: UserStatus;
  role: {
    id: string;
    name: UserRole;
    displayName: string;
  };
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  managerId?: string | null;
  agentId?: string | null;
  clientId?: string | null;
}

export interface AuthState {
  user: SafeUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}
