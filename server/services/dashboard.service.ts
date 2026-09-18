import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';
import { UserRepository } from './user.repository';

const logger = new Logger('DashboardService');

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

export class DashboardService {
  /**
   * Retrieves aggregated dashboard metrics, charts, and activity feeds from database.
   */
  static async getAdminDashboardStats(): Promise<DashboardResponseData> {
    const prisma = getPrismaClient();

    // Ensure seed users in memory if needed
    await UserRepository.initializeSeedUsers();

    try {
      if (prisma) {
        return await this.fetchFromDatabase(prisma);
      }
    } catch (err: any) {
      logger.warn(`Failed querying Prisma database for dashboard stats (${err.message}). Returning zero metrics.`);
    }

    return this.getZeroDashboardStats();
  }

  private static async fetchFromDatabase(prisma: any): Promise<DashboardResponseData> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run parallel counts for performance
    const [
      totalProviders,
      activeProviders,
      totalRanges,
      totalNumbers,
      assignedNumbers,
      totalManagers,
      totalAgents,
      totalClients,
      smsTodayCount,
      smsWeekCount,
      walletsAggregate,
      cdrsAggregate,
      recentAuditLogs,
      recentMessages,
      recentAssignments,
      providersList,
      countriesList,
      numberStatusCounts,
      messagesLast7Days,
      cdrsLast7Days,
    ] = await Promise.all([
      prisma.provider.count().catch(() => 0),
      prisma.provider.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.range.count().catch(() => 0),
      prisma.number.count().catch(() => 0),
      prisma.number.count({ where: { status: 'ASSIGNED' } }).catch(() => 0),
      prisma.user.count({ where: { role: { name: 'MANAGER' } } }).catch(() => 0),
      prisma.user.count({ where: { role: { name: 'AGENT' } } }).catch(() => 0),
      prisma.user.count({ where: { role: { name: 'CLIENT' } } }).catch(() => 0),
      prisma.incomingMessage.count({ where: { receivedAt: { gte: startOfToday } } }).catch(() => 0),
      prisma.incomingMessage.count({ where: { receivedAt: { gte: startOfWeek } } }).catch(() => 0),
      prisma.wallet.aggregate({ _sum: { balance: true } }).catch(() => ({ _sum: { balance: 0 } })),
      prisma.cDR.aggregate({
        _sum: { netProfit: true, clientPayout: true, providerCost: true, agentCommission: true },
      }).catch(() => ({ _sum: { netProfit: 0, clientPayout: 0, providerCost: 0, agentCommission: 0 } })),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }).catch(() => []),
      prisma.incomingMessage.findMany({
        take: 10,
        orderBy: { receivedAt: 'desc' },
        include: { provider: { select: { name: true } }, number: { select: { e164Number: true } } },
      }).catch(() => []),
      prisma.numberAssignment.findMany({
        take: 10,
        orderBy: { assignedAt: 'desc' },
        include: {
          number: { select: { e164Number: true } },
          client: { include: { user: { select: { email: true, firstName: true, lastName: true } } } },
        },
      }).catch(() => []),
      prisma.provider.findMany({
        include: {
          connections: { select: { isConnected: true, throughputLimit: true } },
          _count: { select: { incomingMessages: true, numbers: true } },
        },
      }).catch(() => []),
      prisma.country.findMany({
        include: {
          _count: { select: { numbers: true } },
          numbers: { select: { status: true } },
        },
      }).catch(() => []),
      prisma.number.groupBy({
        by: ['status'],
        _count: { id: true },
      }).catch(() => []),
      prisma.incomingMessage.findMany({
        where: { receivedAt: { gte: sevenDaysAgo } },
        select: { receivedAt: true, status: true },
      }).catch(() => []),
      prisma.cDR.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, clientPayout: true, providerCost: true, netProfit: true, agentCommission: true },
      }).catch(() => []),
    ]);

    const unassignedNumbers = Math.max(0, totalNumbers - assignedNumbers);
    const platformBalance = Number(walletsAggregate._sum?.balance || 0);
    const totalEarnings = Number(cdrsAggregate._sum?.netProfit || 0);

    // Build Time-Series for SMS Volume & Earnings (Last 7 Days) from actual records
    const smsVolume: SmsVolumePoint[] = [];
    const earnings: EarningsPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Count actual messages for this specific day
      const dayMsgs = messagesLast7Days.filter((m: any) => {
        const mDate = new Date(m.receivedAt).toISOString().split('T')[0];
        return mDate === dayStr;
      });

      const inbound = dayMsgs.length;
      const delivered = dayMsgs.filter((m: any) => m.status === 'DELIVERED' || m.status === 'ROUTED').length;
      const failed = dayMsgs.filter((m: any) => m.status === 'FAILED' || m.status === 'REJECTED').length;

      smsVolume.push({
        date: dayStr,
        label: weekday,
        inbound,
        delivered,
        failed,
        total: inbound,
      });

      // Sum actual CDRs for this day
      const dayCdrs = cdrsLast7Days.filter((c: any) => {
        const cDate = new Date(c.createdAt).toISOString().split('T')[0];
        return cDate === dayStr;
      });

      const dayGross = Number(dayCdrs.reduce((acc: number, c: any) => acc + Number(c.clientPayout || 0), 0).toFixed(4));
      const dayCost = Number(dayCdrs.reduce((acc: number, c: any) => acc + Number(c.providerCost || 0), 0).toFixed(4));
      const dayNet = Number(dayCdrs.reduce((acc: number, c: any) => acc + Number(c.netProfit || 0), 0).toFixed(4));
      const dayComm = Number(dayCdrs.reduce((acc: number, c: any) => acc + Number(c.agentCommission || 0), 0).toFixed(4));

      earnings.push({
        date: dayStr,
        label: weekday,
        grossRevenue: dayGross,
        providerCost: dayCost,
        netProfit: dayNet,
        agentCommission: dayComm,
      });
    }

    // Number inventory by status
    const statusMap: Record<string, number> = {
      ASSIGNED: assignedNumbers,
      AVAILABLE: unassignedNumbers,
      RESERVED: 0,
      QUARANTINED: 0,
    };

    if (Array.isArray(numberStatusCounts)) {
      for (const item of numberStatusCounts) {
        if (item.status) {
          statusMap[item.status] = item._count.id;
        }
      }
    }

    const totalStatusCount = Object.values(statusMap).reduce((a, b) => a + b, 0) || totalNumbers;

    const byStatus = totalStatusCount > 0 ? [
      {
        status: 'Assigned',
        count: statusMap.ASSIGNED || 0,
        color: '#2563eb', // blue-600
        percentage: totalStatusCount > 0 ? Math.round(((statusMap.ASSIGNED || 0) / totalStatusCount) * 100) : 0,
      },
      {
        status: 'Available',
        count: statusMap.AVAILABLE || 0,
        color: '#10b981', // emerald-500
        percentage: totalStatusCount > 0 ? Math.round(((statusMap.AVAILABLE || 0) / totalStatusCount) * 100) : 0,
      },
      {
        status: 'Reserved',
        count: statusMap.RESERVED || 0,
        color: '#f59e0b', // amber-500
        percentage: totalStatusCount > 0 ? Math.round(((statusMap.RESERVED || 0) / totalStatusCount) * 100) : 0,
      },
      {
        status: 'Quarantined',
        count: statusMap.QUARANTINED || 0,
        color: '#ef4444', // red-500
        percentage: totalStatusCount > 0 ? Math.round(((statusMap.QUARANTINED || 0) / totalStatusCount) * 100) : 0,
      },
    ] : [];

    // Country Breakdown from real database
    const byCountry = countriesList.map((c: any) => {
      const assigned = c.numbers?.filter((n: any) => n.status === 'ASSIGNED').length || 0;
      const total = c._count?.numbers || c.numbers?.length || 0;
      return {
        country: c.name,
        iso2: c.iso2,
        total,
        assigned,
        available: Math.max(0, total - assigned),
      };
    }).filter((c: any) => c.total > 0);

    // Provider Traffic from real database
    const providerTraffic: ProviderTrafficItem[] = providersList.map((p: any) => {
      const isConnected = p.connections?.some((c: any) => c.isConnected);
      const totalMsgs = p._count?.incomingMessages || 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        protocol: p.protocol || 'HTTP_REST',
        status: p.status || 'ACTIVE',
        totalMessages: totalMsgs,
        successRate: isConnected ? 100 : 0,
        avgLatencyMs: 0,
        throughputTps: 0,
      };
    });

    // Combined Recent Activity Feed from real database events
    const recentActivity: ActivityFeedItem[] = [];

    for (const log of recentAuditLogs) {
      recentActivity.push({
        id: `audit-${log.id}`,
        type: 'AUDIT',
        title: `Audit: ${log.action.replace(/_/g, ' ')}`,
        description: log.entityType ? `Entity: ${log.entityType} (${log.entityId || 'system'})` : 'System action recorded',
        timestamp: log.createdAt.toISOString(),
        status: 'INFO',
        actor: log.user?.email || 'System Admin',
        badge: 'Security',
      });
    }

    for (const msg of recentMessages) {
      recentActivity.push({
        id: `msg-${msg.id}`,
        type: 'MESSAGE',
        title: `Inbound SMS on ${msg.number?.e164Number || msg.destinationAddress}`,
        description: `From: ${msg.senderAddress} • Carrier: ${msg.provider?.name || 'Carrier Gateway'}`,
        timestamp: msg.receivedAt.toISOString(),
        status: 'SUCCESS',
        actor: 'Gateway',
        badge: msg.status,
      });
    }

    for (const assign of recentAssignments) {
      recentActivity.push({
        id: `assign-${assign.id}`,
        type: 'ASSIGNMENT',
        title: `Number Allocated: ${assign.number?.e164Number}`,
        description: `Client: ${assign.client?.user?.email || 'Enterprise Client'} (${assign.status})`,
        timestamp: assign.assignedAt.toISOString(),
        status: 'INFO',
        actor: 'System Admin',
        badge: 'Inventory',
      });
    }

    // Sort by timestamp desc
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      metrics: {
        totalProviders,
        activeProviders,
        totalRanges,
        totalNumbers,
        assignedNumbers,
        unassignedNumbers,
        totalManagers,
        totalAgents,
        totalClients,
        smsToday: smsTodayCount,
        smsThisWeek: smsWeekCount,
        platformBalance: Number(platformBalance.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(4)),
        currency: 'USD',
      },
      charts: {
        smsVolume,
        earnings,
        numberInventory: {
          byStatus,
          byCountry,
          total: totalNumbers,
        },
        providerTraffic,
      },
      recentActivity: recentActivity.slice(0, 10),
      summary: {
        healthyGateways: activeProviders,
        activeChannels: assignedNumbers,
        platformUtilizationRate: totalNumbers > 0 ? Math.round((assignedNumbers / totalNumbers) * 100) : 0,
      },
    };
  }

  private static getZeroDashboardStats(): DashboardResponseData {
    const now = new Date();
    const smsVolume: SmsVolumePoint[] = [];
    const earnings: EarningsPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });

      smsVolume.push({
        date: dayStr,
        label: weekday,
        inbound: 0,
        delivered: 0,
        failed: 0,
        total: 0,
      });

      earnings.push({
        date: dayStr,
        label: weekday,
        grossRevenue: 0,
        providerCost: 0,
        netProfit: 0,
        agentCommission: 0,
      });
    }

    return {
      metrics: {
        totalProviders: 0,
        activeProviders: 0,
        totalRanges: 0,
        totalNumbers: 0,
        assignedNumbers: 0,
        unassignedNumbers: 0,
        totalManagers: 0,
        totalAgents: 0,
        totalClients: 0,
        smsToday: 0,
        smsThisWeek: 0,
        platformBalance: 0,
        totalEarnings: 0,
        currency: 'USD',
      },
      charts: {
        smsVolume,
        earnings,
        numberInventory: {
          byStatus: [],
          byCountry: [],
          total: 0,
        },
        providerTraffic: [],
      },
      recentActivity: [],
      summary: {
        healthyGateways: 0,
        activeChannels: 0,
        platformUtilizationRate: 0,
      },
    };
  }
}
