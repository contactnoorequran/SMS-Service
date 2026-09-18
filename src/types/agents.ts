/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AgentStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'PENDING';

export interface ManagerSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  maxAgents: number;
  assignedAgentsCount: number;
  availableSlots: number;
}

export interface AgentClientSummary {
  id: string;
  name: string;
  email: string;
  companyName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  billingType: 'PREPAID' | 'POSTPAID';
  assignedNumbersCount: number;
  balance: number;
  assignedAt: string;
}

export interface AgentNumberSummary {
  id: string;
  e164Number: string;
  country: string;
  countryCode: string;
  operator: string;
  status: 'ASSIGNED' | 'AVAILABLE' | 'RESERVED';
  clientId: string | null;
  clientName: string | null;
  assignedAt: string | null;
}

export interface AgentCommissionMonthly {
  month: string;
  amount: number;
  messageCount: number;
}

export interface AgentCommissionSummary {
  earned: number; // total lifetime earned
  pending: number; // pending payout
  paid: number; // paid to date
  rate: number; // e.g. 0.05 for 5%
  currentPeriod: string; // e.g. "September 2026"
  historical: AgentCommissionMonthly[];
}

export interface AgentActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AgentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: AgentStatus;
  managerId: string | null;
  managerName: string | null;
  managerEmail: string | null;
  department: string | null;
  clientsCount: number;
  assignedNumbersCount: number;
  commissionRate: number;
  earnings: number;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  organization: string;
}

export interface AgentDetail extends AgentItem {
  manager: ManagerSummary | null;
  clients: AgentClientSummary[];
  numbers: AgentNumberSummary[];
  commission: AgentCommissionSummary;
  recentActivity: AgentActivityItem[];
}

export interface AgentKpiSummary {
  totalAgents: number;
  activeAgents: number;
  suspendedAgents: number;
  totalClientsManaged: number;
  totalAssignedNumbers: number;
  totalCommissionEarned: number;
  averageClientsPerAgent: number;
}

export type AgentsSortField =
  | 'name'
  | 'email'
  | 'manager'
  | 'status'
  | 'clients'
  | 'numbers'
  | 'earnings'
  | 'createdAt'
  | 'lastActivity';

export interface AgentFilterState {
  search: string;
  status: string; // 'ALL' | AgentStatus
  managerId: string; // 'ALL' | managerId
  clientCountRange: string; // 'ALL' | '0' | '1-10' | '11-20' | '20+'
  sortBy: AgentsSortField;
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CreateAgentPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  managerId?: string | null;
  status: AgentStatus;
  role: 'AGENT';
  commissionRate?: number;
}

export interface UpdateAgentPayload {
  name?: string;
  managerId?: string | null;
  status?: AgentStatus;
  commissionRate?: number;
}
