import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';
import { BillingService } from './billing.service';
import { AuditService } from './audit.service';

const logger = new Logger('MessagingService');

export class MessagingService {
  /**
   * Ingests an inbound SMS message from a carrier/provider webhook:
   * 1. Checks provider & number identity
   * 2. Idempotency check via providerId + providerMessageId
   * 3. Finds ActiveAssignment for client/agent routing
   * 4. Persists InboundMessage
   * 5. Atomically triggers BillingEngine to create BillingEvent, CDR, and Ledger entries
   */
  static async ingestInboundMessage(payload: {
    providerId: string;
    providerMessageId?: string;
    fromNumber: string;
    toNumber: string;
    body?: string;
    receivedAt?: Date;
    metadata?: Record<string, any>;
  }) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error('Database connection unavailable');

    // 1. Idempotency check
    if (payload.providerMessageId) {
      const existing = await prisma.inboundMessage.findUnique({
        where: {
          providerId_providerMessageId: {
            providerId: payload.providerId,
            providerMessageId: payload.providerMessageId,
          },
        },
        include: {
          client: true,
          provider: true,
          number: true,
          cdrs: true,
        },
      });
      if (existing) {
        logger.info(`Idempotent skip: Message ${payload.providerMessageId} already ingested.`);
        return { message: existing, duplicate: true };
      }
    }

    // 2. Identify destination Number in inventory
    const cleanToNumber = payload.toNumber.trim();
    let number = await prisma.number.findUnique({
      where: { e164: cleanToNumber },
      include: {
        activeAssignment: true,
      },
    });

    if (!number) {
      // Try with leading plus or stripped plus
      const altNumber = cleanToNumber.startsWith('+') ? cleanToNumber.slice(1) : `+${cleanToNumber}`;
      number = await prisma.number.findUnique({
        where: { e164: altNumber },
        include: { activeAssignment: true },
      });
    }

    if (!number) {
      throw new Error(`Destination number '${payload.toNumber}' does not exist in platform inventory`);
    }

    const assignment = number.activeAssignment;
    const clientId = assignment?.clientId || null;
    const agentId = assignment?.agentId || null;
    const assignmentId = assignment?.id || null;
    const now = payload.receivedAt || new Date();

    // 3. Persist InboundMessage
    const message = await prisma.inboundMessage.create({
      data: {
        organizationId: '00000000-0000-0000-0000-000000000001',
        providerId: payload.providerId,
        providerMessageId: payload.providerMessageId,
        numberId: number.id,
        assignmentId,
        clientId,
        agentId,
        fromNumber: payload.fromNumber,
        toNumber: number.e164,
        body: payload.body || '',
        receivedAt: now,
        status: assignment ? 'ROUTED' : 'UNROUTED',
        billingStatus: 'PENDING',
        metadata: payload.metadata || {},
      },
      include: {
        provider: true,
        client: true,
        number: true,
      },
    });

    // 4. Trigger Billing Cycle
    const billingResult = await BillingService.processInboundBilling({
      id: message.id,
      organizationId: message.organizationId,
      providerId: message.providerId,
      numberId: message.numberId,
      clientId,
      agentId,
    });

    return {
      message,
      billingEvent: billingResult.billingEvent,
      cdr: billingResult.cdr,
      duplicate: false,
    };
  }

  /**
   * Lists inbound messages with search, filters, and pagination.
   */
  static async listMessages(query: {
    search?: string;
    status?: string;
    billingStatus?: string;
    providerId?: string;
    clientId?: string;
    numberId?: string;
    fromNumber?: string;
    toNumber?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const prisma = getPrismaClient();
    if (!prisma) return { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };

    const {
      search = '',
      status = 'ALL',
      billingStatus = 'ALL',
      providerId,
      clientId,
      numberId,
      fromNumber,
      toNumber,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (billingStatus && billingStatus !== 'ALL') where.billingStatus = billingStatus;
    if (providerId) where.providerId = providerId;
    if (clientId) where.clientId = clientId;
    if (numberId) where.numberId = numberId;
    if (fromNumber) where.fromNumber = { contains: fromNumber };
    if (toNumber) where.toNumber = { contains: toNumber };
    if (search) {
      where.OR = [
        { fromNumber: { contains: search, mode: 'insensitive' } },
        { toNumber: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, messages] = await Promise.all([
      prisma.inboundMessage.count({ where }),
      prisma.inboundMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: {
          provider: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
          number: { select: { id: true, e164: true } },
          cdrs: {
            select: {
              id: true,
              clientChargeMicrounits: true,
              providerCostMicrounits: true,
              currency: true,
            },
          },
        },
      }),
    ]);

    const items = messages.map((m) => {
      const cdr = m.cdrs[0];
      return {
        id: m.id,
        providerId: m.providerId,
        providerName: m.provider.name,
        providerMessageId: m.providerMessageId,
        numberId: m.numberId,
        destinationAddress: m.toNumber,
        senderAddress: m.fromNumber,
        body: m.body,
        clientId: m.clientId,
        clientName: m.client?.name || 'Unassigned',
        status: m.status,
        billingStatus: m.billingStatus,
        clientChargeDecimal: cdr ? Number(cdr.clientChargeMicrounits) / 1_000_000 : null,
        providerCostDecimal: cdr ? Number(cdr.providerCostMicrounits) / 1_000_000 : null,
        currency: cdr?.currency || 'USD',
        receivedAt: m.receivedAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves single message details with full CDR routing and financials.
   */
  static async getMessageById(id: string) {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const m = await prisma.inboundMessage.findUnique({
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
        billingEvents: true,
        cdrs: true,
      },
    });

    if (!m) return null;

    const cdr = m.cdrs[0];
    return {
      id: m.id,
      providerId: m.providerId,
      providerName: m.provider.name,
      providerMessageId: m.providerMessageId,
      numberId: m.numberId,
      destinationAddress: m.toNumber,
      senderAddress: m.fromNumber,
      body: m.body,
      clientId: m.clientId,
      clientName: m.client?.name || 'Unassigned',
      agentId: m.agentId,
      agentName: m.agent?.user?.name || null,
      status: m.status,
      billingStatus: m.billingStatus,
      receivedAt: m.receivedAt.toISOString(),
      metadata: m.metadata,
      financials: cdr
        ? {
            cdrId: cdr.id,
            providerCostMicrounits: cdr.providerCostMicrounits.toString(),
            providerCostDecimal: Number(cdr.providerCostMicrounits) / 1_000_000,
            clientChargeMicrounits: cdr.clientChargeMicrounits.toString(),
            clientChargeDecimal: Number(cdr.clientChargeMicrounits) / 1_000_000,
            agentCommissionMicrounits: cdr.agentCommissionMicrounits?.toString() || '0',
            agentCommissionDecimal: cdr.agentCommissionMicrounits ? Number(cdr.agentCommissionMicrounits) / 1_000_000 : 0,
            platformProfitMicrounits: cdr.platformProfitMicrounits?.toString() || '0',
            platformProfitDecimal: cdr.platformProfitMicrounits ? Number(cdr.platformProfitMicrounits) / 1_000_000 : 0,
            currency: cdr.currency,
          }
        : null,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
