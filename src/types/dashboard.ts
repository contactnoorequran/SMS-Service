export interface MetricCardData {
  totalProviders: number;
  activeProviders: number;
  totalRanges: number;
  totalNumbers: number;
  assignedNumbers: number;
  unassignedNumbers: number;
  totalManagers: number;
  totalAgents: number;
  totalClients: number;
  smsToday: number;
  smsThisWeek: number;
  platformBalance: number;
  totalEarnings: number;
  currency: string;
}

export interface SmsVolumePoint {
  date: string;
  label: string;
  inbound: number;
  delivered: number;
  failed: number;
  total: number;
}

export interface EarningsPoint {
  date: string;
  label: string;
  grossRevenue: number;
  providerCost: number;
  netProfit: number;
  agentCommission: number;
}

export interface NumberInventoryData {
  byStatus: Array<{ status: string; count: number; color: string; percentage: number }>;
  byCountry: Array<{ country: string; iso2: string; total: number; assigned: number; available: number }>;
  total: number;
}

export interface ProviderTrafficItem {
  id: string;
  name: string;
  slug: string;
  protocol: string;
  status: string;
  totalMessages: number;
  successRate: number;
  avgLatencyMs: number;
  throughputTps: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'MESSAGE' | 'ASSIGNMENT' | 'AUDIT' | 'FINANCE' | 'SECURITY';
  title: string;
  description: string;
  timestamp: string;
  status: 'SUCCESS' | 'INFO' | 'WARNING';
  actor?: string;
  badge?: string;
}

export interface DashboardResponseData {
  metrics: MetricCardData;
  charts: {
    smsVolume: SmsVolumePoint[];
    earnings: EarningsPoint[];
    numberInventory: NumberInventoryData;
    providerTraffic: ProviderTrafficItem[];
  };
  recentActivity: ActivityFeedItem[];
  summary: {
    healthyGateways: number;
    activeChannels: number;
    platformUtilizationRate: number;
  };
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'SYSTEM' | 'SECURITY' | 'NUMBERS' | 'BILLING';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}
