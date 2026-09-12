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

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tokenId: string; // unique UUID for revocation tracking
  iat?: number;
  exp?: number;
}

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

export interface LoginAuditRecord {
  id: string;
  userId?: string;
  email: string;
  action: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}
