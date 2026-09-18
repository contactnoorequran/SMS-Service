/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ClientStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DISABLED';
export type BillingType = 'PREPAID' | 'POSTPAID';

export interface ManagerSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
}

export interface AgentSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  department?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  clientsCount: number;
  maxClients?: number;
}

export interface ClientNumberSummary {
  id: string;
  e164Number: string;
  country: string;
  countryCode: string;
  operator: string;
  provider: string;
  status: 'ASSIGNED' | 'AVAILABLE' | 'RESERVED';
  assignedAt: string;
  capabilities: string[]; // e.g. ['SMS', 'MMS', 'VOICE']
  monthlyCost: number;
}

export interface ClientTransactionSummary {
  id: string;
  type: 'TOPUP' | 'SMS_CHARGE' | 'NUMBER_FEE' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  balanceAfter: number;
  description: string;
  reference?: string;
  timestamp: string;
}

export interface ClientFinancialSummary {
  balance: number; // micro-unit precision awareness
  currency: string;
  creditLimit: number;
  availableCredit: number;
  totalSpent: number;
  billingType: BillingType;
  lastRechargeDate: string | null;
  lastRechargeAmount: number | null;
  recentTransactions: ClientTransactionSummary[];
}

export interface ClientRecentSmsItem {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'DELIVERED' | 'RECEIVED' | 'FAILED' | 'PENDING';
  timestamp: string;
  cost: number;
}

export interface ClientActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  actor?: string;
}

export interface ClientItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  companyName: string;
  contactPhone: string;
  billingType: BillingType;
  status: ClientStatus;
  managerId: string | null;
  managerName: string | null;
  agentId: string | null;
  agentName: string | null;
  agentEmail: string | null;
  assignedNumbersCount: number;
  balance: number;
  currency: string;
  smsCount: number;
  inboundSmsCount: number;
  outboundSmsCount: number;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  organization: string;
}

export interface ClientDetail extends ClientItem {
  agent: AgentSummary | null;
  manager: ManagerSummary | null;
  numbers: ClientNumberSummary[];
  financials: ClientFinancialSummary;
  recentSms: ClientRecentSmsItem[];
  recentActivity: ClientActivityItem[];
  address?: string;
  website?: string;
  apiAccess?: {
    enabled: boolean;
    rateLimitPerSecond: number;
    activeKeysCount: number;
    lastUsedAt: string | null;
  };
}

export interface ClientKpiSummary {
  totalClients: number;
  activeClients: number;
  suspendedClients: number;
  totalAssignedNumbers: number;
  totalWalletBalance: number;
  totalSmsCount: number;
  averageBalance: number;
}

export type ClientsSortField =
  | 'name'
  | 'companyName'
  | 'createdAt'
  | 'balance'
  | 'smsCount'
  | 'numbers'
  | 'lastActivity';

export interface ClientFilterState {
  search: string;
  status: string; // 'ALL' | ClientStatus
  billingType: string; // 'ALL' | BillingType
  agentId: string; // 'ALL' | 'UNASSIGNED' | agentId
  managerId: string; // 'ALL' | 'UNASSIGNED' | managerId
  balanceRange: string; // 'ALL' | 'ZERO' | '1-1000' | '1001-10000' | '10000+'
  sortBy: ClientsSortField;
  sortDir: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface CreateClientPayload {
  name: string;
  email: string;
  companyName: string;
  contactPhone: string;
  billingType: BillingType;
  initialBalance?: number;
  creditLimit?: number;
  agentId?: string | null;
  status: ClientStatus;
}

export interface UpdateClientPayload {
  name?: string;
  companyName?: string;
  contactPhone?: string;
  billingType?: BillingType;
  creditLimit?: number;
  agentId?: string | null;
  status?: ClientStatus;
}
