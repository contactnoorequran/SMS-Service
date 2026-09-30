import { ingestCarrierMessage } from './carrier-ingestion';
import { EventEmitter } from 'events';
import { getPrismaClient } from '../db/prisma';
import { Logger } from '../utils/logger';
import { BillingService } from './billing.service';
import { AuditService } from './audit.service';

const logger = new Logger('MessagingService');
export const messageEmitter = new EventEmitter();
messageEmitter.setMaxListeners(200);

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
    const result = await ingestCarrierMessage(payload);
    if (!result.duplicate) messageEmitter.emit('new_message', result.message);
    return result;
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
    agentId?: string;
    managerId?: string;
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
    if (query.agentId) where.agentId = query.agentId;
    if (query.managerId) where.agent = { managerProfileId: query.managerId };
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
