import { CarrierStore, DEMO_PROVIDER_ID } from './carrier-store';
import { publicConnection, testCarrier } from './carrier-runtime';
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

export class ProviderService {
  /**
   * Lists providers with search, filter by status, and pagination.
   */
  static async listProviders(query: {search?: string; status?: string; page?: number; limit?: number} = {}): Promise<{items: ProviderListItem[]; total: number; page: number; limit: number; totalPages: number}> {
    const search = query.search?.trim() || '';
    const status = query.status || 'ALL';
    const page = Number.isFinite(query.page) ? Math.max(1, Math.floor(query.page!)) : 1;
    const limit = Number.isFinite(query.limit) ? Math.min(100, Math.max(1, Math.floor(query.limit!))) : 10;
    const demo = await CarrierStore.demoProvider();
    const showDemo = process.env.NODE_ENV !== 'production' && (!search || demo.name.toLowerCase().includes(search.toLowerCase())) && (status === 'ALL' || status === demo.status);
    const db = getPrismaClient();
    if (!db) {
      const items = showDemo && page === 1 ? [demo as ProviderListItem] : [];
      return {items, total: showDemo ? 1 : 0, page, limit, totalPages: 1};
    }
    const where: any = {id: {not: DEMO_PROVIDER_ID}, ...(status !== 'ALL' ? {status} : {}), ...(search ? {name: {contains: search, mode: 'insensitive'}} : {})};
    const offset = (page-1)*limit;
    const take = limit - (showDemo && page === 1 ? 1 : 0);
    const [count, rows] = await Promise.all([
      db.provider.count({where}),
      db.provider.findMany({where, skip: Math.max(0, offset - (showDemo ? 1 : 0)), take, orderBy: [{createdAt:'desc'}, {id:'asc'}], include: {_count:{select:{connections:true,numbers:true,ranges:true}}}}),
    ]);
    const items: ProviderListItem[] = await Promise.all(rows.map(async p => ({id:p.id, name:p.name, status:p.status as any, connectionsCount:p._count.connections, numbersCount:p._count.numbers, rangesCount:p._count.ranges, connections:(await CarrierStore.list(p.id)).map(publicConnection), createdAt:p.createdAt.toISOString(), updatedAt:p.updatedAt.toISOString()})));
    if(showDemo && page===1)items.unshift(demo as ProviderListItem);
    const total=count+(showDemo?1:0);
    return {items,total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))};
  }

  static async getProviderById(id: string): Promise<ProviderDetail | null> {
    if(id===DEMO_PROVIDER_ID)return process.env.NODE_ENV === 'production' ? null : await CarrierStore.demoProvider() as ProviderDetail;
    const db=getPrismaClient();if(!db)return null;
    const p=await db.provider.findUnique({where:{id},include:{ranges:{include:{country:true}},_count:{select:{connections:true,numbers:true,ranges:true}}}});
    if(!p)return null;
    return {id:p.id,name:p.name,status:p.status as any,connectionsCount:p._count.connections,numbersCount:p._count.numbers,rangesCount:p._count.ranges,
      connections:(await CarrierStore.list(p.id)).map(publicConnection),
      ranges:p.ranges.map(r=>({id:r.id,startE164:r.startE164,endE164:r.endE164,status:r.status,country:{id:r.country.id,name:r.country.name,isoCode:r.country.isoCode}})),
      createdAt:p.createdAt.toISOString(),updatedAt:p.updatedAt.toISOString()};
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
    let org = await prisma.organization.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000001' },
    });
    if (!org) {
      org = await prisma.organization.findFirst();
    }
    const orgId = org ? org.id : '00000000-0000-0000-0000-000000000001';

    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        status: (data.status || 'ACTIVE') as any,
        organizationId: orgId,
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
    const connections = await CarrierStore.list(providerId);
    const connection = connectionId ? connections.find(c => c.id === connectionId) : connections[0];
    if (!connection) throw new Error('Connection not configured');
    return testCarrier(connection);
  }
}
