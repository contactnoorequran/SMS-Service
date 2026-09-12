export type ClientStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type BillingType = 'PREPAID' | 'POSTPAID';
export type ApiAccessStatus = 'ACTIVE' | 'REVOKED' | 'DISABLED';

export interface ClientApiCredential {
  id: string;
  clientId: string;
  clientSecret: string;
  plainSecret?: string;
  name: string;
  status: ApiAccessStatus;
  rateLimit: number;
  ipWhitelist: string[];
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAssignedNumber {
  id: string;
  e164Number: string;
  country: string;
  countryCode: string;
  operator: string;
  status: 'ASSIGNED' | 'AVAILABLE' | 'RESERVED';
  capabilities: string;
  assignedAt: string;
  monthlyCost?: number;
}

export interface ClientSmsStatistics {
  totalSms: number;
  deliveredSms: number;
  failedSms: number;
  pendingSms: number;
  successRate: number;
  totalSpent: number;
  dailyVolume: Array<{
    date: string;
    count: number;
    delivered: number;
    failed: number;
  }>;
}

export interface ClientRecentSms {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'DELIVERED' | 'RECEIVED' | 'FAILED' | 'PENDING';
  timestamp: string;
  cost: number;
}

export interface ClientBalanceInfo {
  balance: number;
  currency: string;
  billingType: BillingType;
  creditLimit: number;
  totalSpent: number;
  lastRechargeDate: string | null;
  lastRechargeAmount: number | null;
}

export interface ClientActivity {
  id: string;
  action: string;
  reason?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ClientListItem {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  companyName: string;
  contact: string;
  billingType: BillingType;
  status: ClientStatus;
  managerId: string | null;
  managerName: string | null;
  managerEmail: string | null;
  agentId: string | null;
  agentName: string | null;
  agentEmail: string | null;
  assignedNumbersCount: number;
  balance: number;
  smsCount: number;
  apiAccessEnabled: boolean;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDetail extends ClientListItem {
  manager: {
    id: string;
    userId: string;
    name: string;
    email: string;
    department?: string | null;
  } | null;
  agent: {
    id: string;
    userId: string;
    name: string;
    email: string;
    commissionRate?: number;
  } | null;
  numbers: ClientAssignedNumber[];
  smsStats: ClientSmsStatistics;
  balanceInfo: ClientBalanceInfo;
  recentActivity: ClientActivity[];
  apiCredentials: ClientApiCredential[];
  recentSms: ClientRecentSms[];
}

export interface ClientDashboardData {
  client: ClientListItem;
  assignedNumbers: ClientAssignedNumber[];
  smsCount: number;
  recentSms: ClientRecentSms[];
  balance: ClientBalanceInfo;
  smsStats: ClientSmsStatistics;
  apiStatus: {
    enabled: boolean;
    activeKeysCount: number;
    rateLimit: number;
    credentials: ClientApiCredential[];
  };
}

export interface CreateClientDTO {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  contact: string;
  managerId?: string | null;
  agentId?: string | null;
  billingType?: BillingType;
  status?: ClientStatus;
  initialBalance?: number;
  password?: string;
  permissions?: string[];
  enableApiAccess?: boolean;
}

export interface UpdateClientDTO {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  contact?: string;
  billingType?: BillingType;
  status?: ClientStatus;
  managerId?: string | null;
  agentId?: string | null;
}

export interface ConfigureClientApiDTO {
  enableApiAccess: boolean;
  name?: string;
  rateLimit?: number;
  ipWhitelist?: string[];
  regenerateKey?: boolean;
  status?: ApiAccessStatus;
}

export interface ClientListQuery {
  search?: string;
  status?: string;
  managerId?: string;
  agentId?: string;
  billingType?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | 'name'
    | 'companyName'
    | 'email'
    | 'createdAt'
    | 'balance'
    | 'smsCount'
    | 'assignedNumbersCount';
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedClients {
  items: ClientListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
    totalNumbers: number;
    totalBalance: number;
    totalSms: number;
  };
  scopeInfo: {
    actorRole: string;
    isScopedToManager: boolean;
    isScopedToAgent: boolean;
    managerId?: string | null;
    agentId?: string | null;
  };
}
