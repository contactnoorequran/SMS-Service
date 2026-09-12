import { UserStatus, LoginAuditRecord } from './auth';

export interface AgentStatistics {
  totalClients: number;
  assignedNumbers: number;
  unassignedNumbers: number;
  smsCount: number;
  earnings: number;
  currentBalance: number;
  currency: string;
}

export interface AgentClientItem {
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

export interface AgentNumberItem {
  id: string;
  e164Number: string;
  country: string;
  countryCode: string;
  operator: string;
  status: 'ASSIGNED' | 'AVAILABLE' | 'RESERVED' | 'UNASSIGNED';
  clientId: string | null;
  clientName: string | null;
  capabilities: string;
  assignedAt: string | null;
}

export interface AgentListItem {
  id: string; // AgentProfile ID
  userId: string; // User ID
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  contact: string;
  managerId: string | null;
  managerName: string | null;
  managerEmail: string | null;
  department: string | null;
  commissionRate: number; // e.g. 0.05 for 5%
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  clientsCount: number;
  assignedNumbersCount: number;
  unassignedNumbersCount: number;
  smsCount: number;
  earnings: number;
  balance: number;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDetail extends AgentListItem {
  manager: {
    id: string;
    userId: string;
    name: string;
    email: string;
    department?: string;
  } | null;
  statistics: AgentStatistics;
  clients: AgentClientItem[];
  numbers: AgentNumberItem[];
  recentActivity: LoginAuditRecord[];
}

export interface CreateAgentDTO {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  managerId?: string | null;
  commissionRate?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  password?: string;
  permissions?: string[];
}

export interface UpdateAgentDTO {
  firstName?: string;
  lastName?: string;
  contact?: string;
  managerId?: string | null;
  commissionRate?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface AgentListQuery {
  search?: string;
  status?: string;
  managerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'username' | 'email' | 'createdAt' | 'earnings' | 'smsCount' | 'clientsCount';
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedAgents {
  items: AgentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    totalClients: number;
    totalNumbers: number;
    totalEarnings: number;
    totalSms: number;
  };
  scopeInfo: {
    actorRole: string;
    isScopedToManager: boolean;
    managerName?: string;
    managerId?: string;
  };
}
