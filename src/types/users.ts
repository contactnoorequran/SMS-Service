import { UserRole, PermissionCode } from './auth';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DISABLED';

export interface UserItem {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  status: UserStatus;
  role: {
    id: string;
    name: UserRole;
    displayName: string;
  };
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
  department?: string;
  managerId?: string | null;
  agentId?: string | null;
  clientId?: string | null;
}

export interface UserKpiSummary {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
}

export type UsersSortField = 'name' | 'email' | 'role' | 'status' | 'createdAt' | 'lastLoginAt';

export interface UserFilterState {
  search: string;
  role: string;
  status: string;
  sortBy: UsersSortField;
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  department?: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  department?: string;
}

export interface RoleDefinition {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  hierarchyWeight: number;
  userCount: number;
  assignedPermissions: PermissionCode[];
}

export interface PermissionGroup {
  module: string;
  displayName: string;
  description: string;
  permissions: {
    code: PermissionCode;
    name: string;
    description: string;
  }[];
}
