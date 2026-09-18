import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';

const logger = new Logger('CdrService');

export class CdrService {
  /**
   * Lists Call Detail Records (CDRs) with filtering, pagination, and dual decimal/micro-unit representations.
   */
  static async listCdrs(query: {
    providerId?: string;
    clientId?: string;
    agentId?: string;
    numberId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };

    const { providerId, clientId, agentId, numberId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (providerId) where.providerId = providerId;
    if (clientId) where.clientId = clientId;
    if (agentId) where.agentId = agentId;
    if (numberId) where.numberId = numberId;

    const [total, cdrs] = await Promise.all([
      prisma.cdr.count({ where }),
      prisma.cdr.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
          agent: {
            include: { user: { select: { name: true } } },
          },
          number: { select: { id: true, e164: true } },
          inboundMessage: {
            select: {
              id: true,
              fromNumber: true,
              toNumber: true,
              body: true,
              receivedAt: true,
            },
          },
        },
      }),
    ]);

    const items = cdrs.map((c) => ({
      id: c.id,
      inboundMessageId: c.inboundMessageId,
      providerId: c.providerId,
      providerName: c.provider.name,
      numberId: c.numberId,
      e164: c.number.e164,
      fromNumber: c.inboundMessage?.fromNumber || 'Unknown',
      clientId: c.clientId,
      clientName: c.client?.name || 'Platform/Direct',
      agentId: c.agentId,
      agentName: c.agent?.user?.name || null,
      currency: c.currency,
      providerCostMicrounits: c.providerCostMicrounits.toString(),
      providerCostDecimal: Number(c.providerCostMicrounits) / 1_000_000,
      clientChargeMicrounits: c.clientChargeMicrounits.toString(),
      clientChargeDecimal: Number(c.clientChargeMicrounits) / 1_000_000,
      agentCommissionMicrounits: c.agentCommissionMicrounits ? c.agentCommissionMicrounits.toString() : '0',
      agentCommissionDecimal: c.agentCommissionMicrounits ? Number(c.agentCommissionMicrounits) / 1_000_000 : 0,
      platformProfitMicrounits: c.platformProfitMicrounits ? c.platformProfitMicrounits.toString() : '0',
      platformProfitDecimal: c.platformProfitMicrounits ? Number(c.platformProfitMicrounits) / 1_000_000 : 0,
      createdAt: c.createdAt.toISOString(),
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
   * Retrieves single CDR details.
   */
  static async getCdrById(id: string) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const c = await prisma.cdr.findUnique({
      where: { id },
      include: {
        provider: true,
        client: true,
        agent: {
          include: { user: { select: { name: true, email: true } } },
        },
        number: {
          include: { country: true, operator: true },
        },
        inboundMessage: true,
        billingEvent: true,
      },
    });

    if (!c) return null;

    return {
      id: c.id,
      inboundMessageId: c.inboundMessageId,
      providerId: c.providerId,
      providerName: c.provider.name,
      numberId: c.numberId,
      e164: c.number.e164,
      country: c.number.country.name,
      operator: c.number.operator?.name,
      fromNumber: c.inboundMessage?.fromNumber,
      toNumber: c.inboundMessage?.toNumber,
      body: c.inboundMessage?.body,
      clientId: c.clientId,
      clientName: c.client?.name || 'Platform/Direct',
      agentId: c.agentId,
      agentName: c.agent?.user?.name || null,
      currency: c.currency,
      providerCostMicrounits: c.providerCostMicrounits.toString(),
      providerCostDecimal: Number(c.providerCostMicrounits) / 1_000_000,
      clientChargeMicrounits: c.clientChargeMicrounits.toString(),
      clientChargeDecimal: Number(c.clientChargeMicrounits) / 1_000_000,
      agentCommissionMicrounits: c.agentCommissionMicrounits ? c.agentCommissionMicrounits.toString() : '0',
      agentCommissionDecimal: c.agentCommissionMicrounits ? Number(c.agentCommissionMicrounits) / 1_000_000 : 0,
      platformProfitMicrounits: c.platformProfitMicrounits ? c.platformProfitMicrounits.toString() : '0',
      platformProfitDecimal: c.platformProfitMicrounits ? Number(c.platformProfitMicrounits) / 1_000_000 : 0,
      createdAt: c.createdAt.toISOString(),
    };
  }

  /**
   * Aggregates CDR financials (total volume, costs, charges, profit, and margin).
   */
  static async getCdrSummary(query: {
    providerId?: string;
    clientId?: string;
  } = {}) {
    const prisma = getPrismaClient();
    if (!prisma) {
      return {
        totalRecords: 0,
        totalProviderCostDecimal: 0,
        totalClientChargeDecimal: 0,
        totalAgentCommissionDecimal: 0,
        totalPlatformProfitDecimal: 0,
        profitMarginPercentage: 0,
      };
    }

    const where: any = {};
    if (query.providerId) where.providerId = query.providerId;
    if (query.clientId) where.clientId = query.clientId;

    const cdrs = await prisma.cdr.findMany({
      where,
      select: {
        providerCostMicrounits: true,
        clientChargeMicrounits: true,
        agentCommissionMicrounits: true,
        platformProfitMicrounits: true,
      },
    });

    let totalProviderCostMicrounits = 0n;
    let totalClientChargeMicrounits = 0n;
    let totalAgentCommissionMicrounits = 0n;
    let totalPlatformProfitMicrounits = 0n;

    for (const c of cdrs) {
      totalProviderCostMicrounits += c.providerCostMicrounits;
      totalClientChargeMicrounits += c.clientChargeMicrounits;
      if (c.agentCommissionMicrounits) totalAgentCommissionMicrounits += c.agentCommissionMicrounits;
      if (c.platformProfitMicrounits) totalPlatformProfitMicrounits += c.platformProfitMicrounits;
    }

    const totalProviderCostDecimal = Number(totalProviderCostMicrounits) / 1_000_000;
    const totalClientChargeDecimal = Number(totalClientChargeMicrounits) / 1_000_000;
    const totalAgentCommissionDecimal = Number(totalAgentCommissionMicrounits) / 1_000_000;
    const totalPlatformProfitDecimal = Number(totalPlatformProfitMicrounits) / 1_000_000;

    const profitMarginPercentage = totalClientChargeDecimal > 0
      ? (totalPlatformProfitDecimal / totalClientChargeDecimal) * 100
      : 0;

    return {
      totalRecords: cdrs.length,
      totalProviderCostDecimal,
      totalClientChargeDecimal,
      totalAgentCommissionDecimal,
      totalPlatformProfitDecimal,
      profitMarginPercentage: Math.round(profitMarginPercentage * 10) / 10,
    };
  }
}
