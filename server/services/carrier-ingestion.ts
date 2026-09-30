import { getPrismaClient } from '../db/prisma';
import { BillingService } from './billing.service';
export interface InboundPayload {providerId: string; providerMessageId?: string; fromNumber: string; toNumber: string; body?: string; receivedAt?: Date; metadata?: Record<string,any>}
export async function ingestCarrierMessage(payload: InboundPayload) {
  const db = getPrismaClient(); if (!db) throw new Error('Database connection unavailable');
  if (!payload.providerMessageId) throw new Error('A stable provider message ID is required');
  if (!payload.fromNumber || !payload.toNumber || (payload.body?.length || 0) > 40000) throw new Error('Invalid message');
  if (payload.receivedAt && !Number.isFinite(payload.receivedAt.getTime())) throw new Error('Invalid received timestamp');
  return db.$transaction(async tx => {
    const lock = `${payload.providerId}:${payload.providerMessageId}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lock}, 0))`;
    const provider = await tx.provider.findUnique({where: {id: payload.providerId}});
    if (!provider || provider.status !== 'ACTIVE') throw new Error('Active provider required');
    let message = await tx.inboundMessage.findUnique({where: {providerId_providerMessageId: {providerId: payload.providerId, providerMessageId: payload.providerMessageId!}}, include: {provider: true, client: true, number: true}});
    const duplicate = Boolean(message);
    if (!message) {
      const to = payload.toNumber.trim();
      const number = await tx.number.findFirst({where: {e164: {in: [to, to.startsWith('+') ? to.slice(1) : '+'+to]}, providerId: provider.id, organizationId: provider.organizationId}, include: {activeAssignment: true}});
      if (!number) throw new Error('Destination number is not owned by this provider in the inventory');
      const assignment = number.activeAssignment;
      message = await tx.inboundMessage.create({data: {
        organizationId: provider.organizationId, providerId: provider.id, providerMessageId: payload.providerMessageId,
        numberId: number.id, assignmentId: assignment?.id, clientId: assignment?.clientId, agentId: assignment?.agentId,
        fromNumber: payload.fromNumber, toNumber: number.e164, body: payload.body || '', receivedAt: payload.receivedAt || new Date(),
        status: assignment ? 'ROUTED' : 'UNROUTED', billingStatus: 'PENDING', metadata: payload.metadata || {},
      }, include: {provider: true, client: true, number: true}});
    }
    // Creation, billing and acknowledgement are one atomic operation. Retries can repair older pending rows.
    const billing = await BillingService.processInboundBilling({id: message.id, organizationId: message.organizationId, providerId: message.providerId, numberId: message.numberId, clientId: message.clientId, agentId: message.agentId}, tx);
    return {message: {...message, billingStatus: 'BILLED'}, billingEvent: billing.billingEvent, cdr: billing.cdr, duplicate};
  }, {maxWait: 15000, timeout: 30000});
}
