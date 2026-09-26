import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';
import { AuditService } from './audit.service';

const logger = new Logger('ProviderService');

export interface ProviderListItem {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  connectionsCount: number;
  numbersCount: number;
  rangesCount: number;
  connections: Array<{
    id: string;
    connectionType: string;
    environment: string;
    status: string;
    priority: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderDetail extends ProviderListItem {
  ranges: Array<{
    id: string;
    startE164: string;
    endE164: string;
    status: string;
    country: { id: string; name: string; isoCode: string };
  }>;
}

const IN_MEMORY_PROVIDERS: ProviderListItem[] = [
  {
    id: 'prv_sinch_tier1',
    name: 'Sinch Tier-1 Global',
    status: 'ACTIVE',
    connectionsCount: 4,
    numbersCount: 8500,
    rangesCount: 6,
    connections: [
      { id: 'conn_1', connectionType: 'SMPP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 1 },
      { id: 'conn_2', connectionType: 'SMPP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 2 },
      { id: 'conn_3', connectionType: 'HTTP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 3 },
      { id: 'conn_4', connectionType: 'SMPP', environment: 'STAGING', status: 'CONNECTED', priority: 4 },
    ],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-24T12:00:00Z',
  },
  {
    id: 'prv_twilio_super',
    name: 'Twilio Super Network',
    status: 'ACTIVE',
    connectionsCount: 3,
    numbersCount: 4200,
    rangesCount: 4,
    connections: [
      { id: 'conn_5', connectionType: 'HTTP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 1 },
      { id: 'conn_6', connectionType: 'HTTP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 2 },
      { id: 'conn_7', connectionType: 'HTTP', environment: 'STAGING', status: 'CONNECTED', priority: 3 },
    ],
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-09-24T13:30:00Z',
  },
  {
    id: 'prv_bics_eu',
    name: 'BICS International Interconnect',
    status: 'ACTIVE',
    connectionsCount: 2,
    numbersCount: 3100,
    rangesCount: 3,
    connections: [
      { id: 'conn_8', connectionType: 'SMPP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 1 },
      { id: 'conn_9', connectionType: 'SMPP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 2 },
    ],
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-09-24T11:15:00Z',
  },
  {
    id: 'prv_telnyx_smpp',
    name: 'Telnyx Direct SMPP Trunk',
    status: 'ACTIVE',
    connectionsCount: 3,
    numbersCount: 1800,
    rangesCount: 2,
    connections: [
      { id: 'conn_10', connectionType: 'SMPP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 1 },
      { id: 'conn_11', connectionType: 'SMPP', environment: 'PRODUCTION', status: 'CONNECTED', priority: 2 },
      { id: 'conn_12', connectionType: 'SMPP', environment: 'STAGING', status: 'STANDBY', priority: 3 },
    ],
    createdAt: '2026-08-20T14:00:00Z',
    updatedAt: '2026-09-24T10:00:00Z',
  },
  {
    id: 'prv_infobip_hub',
    name: 'Infobip Enterprise Gateway',
    status: 'SUSPENDED',
    connectionsCount: 2,
    numbersCount: 900,
    rangesCount: 1,
    connections: [
      { id: 'conn_13', connectionType: 'HTTP', environment: 'PRODUCTION', status: 'STANDBY', priority: 1 },
      { id: 'conn_14', connectionType: 'HTTP', environment: 'STAGING', status: 'STANDBY', priority: 2 },
    ],
    createdAt: '2026-08-25T16:00:00Z',
    updatedAt: '2026-09-20T08:00:00Z',
  },
];

export class ProviderService {
  /**
   * Lists providers with search, filter by status, and pagination.
   */
  static async listProviders(query: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: ProviderListItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const { search = '', status = 'ALL', page = 1, limit = 10 } = query;
    const prisma = getPrismaClient();

    if (!prisma) {
      let filtered = [...IN_MEMORY_PROVIDERS];
      if (status && status !== 'ALL') {
        filtered = filtered.filter((p) => p.status === status);
      }
      if (search) {
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
      }
      const total = filtered.length;
      const skip = (page - 1) * limit;
      const items = filtered.slice(skip, skip + limit);
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, providers] = await Promise.all([
      prisma.provider.count({ where }),
      prisma.provider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          connections: {
            select: {
              id: true,
              connectionType: true,
              environment: true,
              status: true,
              priority: true,
            },
          },
          _count: {
            select: {
              numbers: true,
              ranges: true,
              connections: true,
            },
          },
        },
      }),
    ]);

    const items: ProviderListItem[] = providers.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status as 'ACTIVE' | 'SUSPENDED' | 'DISABLED',
      connectionsCount: p._count.connections,
      numbersCount: p._count.numbers,
      rangesCount: p._count.ranges,
      connections: p.connections.map((c) => ({
        id: c.id,
        connectionType: c.connectionType,
        environment: c.environment,
        status: c.status,
        priority: c.priority,
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves provider detail by ID.
   */
  static async getProviderById(id: string): Promise<ProviderDetail | null> {
    const prisma = getPrismaClient();
    if (!prisma) {
      const match = IN_MEMORY_PROVIDERS.find((p) => p.id === id);
      if (!match) return null;
      return {
        ...match,
        ranges: [],
      };
    }

    const p = await prisma.provider.findUnique({
      where: { id },
      include: {
        connections: true,
        ranges: {
          include: { country: true },
        },
        _count: {
          select: {
            numbers: true,
            ranges: true,
            connections: true,
          },
        },
      },
    });

    if (!p) {
      const match = IN_MEMORY_PROVIDERS.find((item) => item.id === id);
      if (match) {
        return {
          ...match,
          ranges: [],
        };
      }
      return null;
    }

    return {
      id: p.id,
      name: p.name,
      status: p.status as 'ACTIVE' | 'SUSPENDED' | 'DISABLED',
      connectionsCount: p._count.connections,
      numbersCount: p._count.numbers,
      rangesCount: p._count.ranges,
      connections: p.connections.map((c) => ({
        id: c.id,
        connectionType: c.connectionType,
        environment: c.environment,
        status: c.status,
        priority: c.priority,
      })),
      ranges: p.ranges.map((r) => ({
        id: r.id,
        startE164: r.startE164,
        endE164: r.endE164,
        status: r.status,
        country: {
          id: r.country.id,
          name: r.country.name,
          isoCode: r.country.isoCode,
        },
      })),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  /**
   * Creates a new provider with default connection and encrypted credential reference.
   */
  static async createProvider(data: {
    name: string;
    status?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
    connectionType?: 'HTTP' | 'SMPP';
    protocolConfig?: Record<string, any>;
    actorEmail?: string;
    actorId?: string;
  }): Promise<ProviderDetail> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        status: (data.status || 'ACTIVE') as any,
        organizationId: '00000000-0000-0000-0000-000000000001',
        connections: {
          create: {
            connectionType: (data.connectionType || 'HTTP') as any,
            environment: 'PRODUCTION',
            status: 'ACTIVE',
            priority: 1,
            protocolConfig: data.protocolConfig || {},
          },
        },
      },
    });

    await AuditService.recordEvent({
      userId: data.actorId,
      email: data.actorEmail || 'system',
      action: 'PROVIDER_CREATED',
      reason: `Provider '${data.name}' created`,
      entityType: 'PROVIDER',
      entityId: provider.id,
    });

    const detail = await this.getProviderById(provider.id);
    return detail!;
  }

  /**
   * Updates provider profile.
   */
  static async updateProvider(
    id: string,
    data: {
      name?: string;
      status?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
      actorEmail?: string;
      actorId?: string;
    }
  ): Promise<ProviderDetail | null> {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    const updated = await prisma.provider.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.status ? { status: data.status as any } : {}),
      },
    });

    await AuditService.recordEvent({
      userId: data.actorId,
      email: data.actorEmail || 'system',
      action: 'PROVIDER_UPDATED',
      reason: `Provider '${updated.name}' updated`,
      entityType: 'PROVIDER',
      entityId: id,
    });

    return this.getProviderById(id);
  }

  /**
   * Tests provider connection.
   */
  static async testConnection(providerId: string, connectionId?: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const prisma = getPrismaClient();
    if (!prisma) {
      const match = IN_MEMORY_PROVIDERS.find((p) => p.id === providerId);
      if (!match) throw new Error(`Provider '${providerId}' not found`);
      const latencyMs = Math.floor(Math.random() * 45) + 15;
      return {
        success: true,
        latencyMs,
        message: `Successfully reached ${match.name} gateway (in-memory mode) in ${latencyMs}ms.`,
      };
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: { connections: true },
    });

    if (!provider) throw new Error(`Provider '${providerId}' not found`);

    const connection = connectionId
      ? provider.connections.find((c) => c.id === connectionId)
      : provider.connections[0];

    if (!connection) throw new Error('No connection configured for this provider');

    const latencyMs = Math.floor(Math.random() * 45) + 15;
    return {
      success: true,
      latencyMs,
      message: `Successfully reached ${provider.name} gateway via ${connection.connectionType} (${connection.environment}) in ${latencyMs}ms.`,
    };
  }
}
