import { UserStatus, LoginAuditRecord } from './auth';

export interface ManagerAgentItem {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  status: 'ACTIVE' | 'INACTIVE';
  commissionRate: number; // e.g. 0.05 for 5%
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
  recentActivity: LoginAuditRecord[];
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
  sortBy?: 'name' | 'username' | 'email' | 'createdAt' | 'lastLoginAt' | 'department';
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedManagers {
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
