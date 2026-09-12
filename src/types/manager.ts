import { UserStatus } from './auth';

export interface ManagerAgentItem {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  status: 'ACTIVE' | 'INACTIVE';
  commissionRate: number;
  clientsCount: number;
  createdAt: string;
}

export interface ManagerClientItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  companyName: string;
  contact: string;
  billingType: 'PREPAID' | 'POSTPAID';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  assignedNumbersCount: number;
  balance: number;
  createdAt: string;
}

export interface ManagerActivitySummary {
  totalAgents: number;
  totalClients: number;
  totalLogins: number;
  recentActionsCount: number;
  lastActive: string | null;
}

export interface ManagerListItem {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  contact: string;
  department: string;
  status: UserStatus;
  maxAgents: number;
  agentsCount: number;
  clientsCount: number;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerDetail extends ManagerListItem {
  activitySummary: ManagerActivitySummary;
  agents: ManagerAgentItem[];
  clients: ManagerClientItem[];
  recentActivity: Array<{
    id: string;
    action: string;
    reason?: string;
    email: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }>;
}

export interface CreateManagerDTO {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  department: string;
  maxAgents?: number;
  status?: UserStatus;
  password?: string;
  permissions?: string[];
}

export interface UpdateManagerDTO {
  username?: string;
  firstName?: string;
  lastName?: string;
  contact?: string;
  department?: string;
  maxAgents?: number;
}

export interface ManagerListQuery {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedManagersResponse {
  items: ManagerListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
    totalAgentsManaged: number;
    totalClientsManaged: number;
  };
}

export interface PermissionDefinition {
  code: string;
  name: string;
  category: string;
  description: string;
}
