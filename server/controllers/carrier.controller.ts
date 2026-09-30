import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CarrierStore, SavedConnection } from '../services/carrier-store';
import { publicConnection, recordReceipt, sendCarrier, testCarrier } from '../services/carrier-runtime';
import { constantEqual, validateHmac, validateTelnyx, validateTwilio } from '../services/carrier-security';
import { MessagingService } from '../services/messaging.service';
import { sendSuccess, sendError } from '../utils/api-response';
import { AuditService } from '../services/audit.service';
import { getPrismaClient } from '../db/prisma';
import { SafeUser } from '../types/auth';

const outboundSchema = z.object({from: z.string().min(1).max(21), to: z.string().regex(/^\+[1-9]\d{6,14}$/), body: z.string().min(1).max(10000), idempotencyKey: z.string().min(8).max(128)}).strict();
export const captureRawBody = (req: any, _res: any, body: Buffer) => { req.rawBody = Buffer.from(body); };
export async function canViewMessage(user: SafeUser | undefined, message: any): Promise<boolean> {
  if (!user) return false;
  if (user.role.name === 'SUPER_ADMIN') return true;
  if (user.role.name === 'CLIENT') return Boolean(user.clientId && user.clientId === message.clientId);
  if (user.role.name === 'AGENT') return Boolean(user.agentId && user.agentId === message.agentId);
  if (user.role.name === 'MANAGER' && user.managerId && message.agentId) {
    const db = getPrismaClient(); if (!db) return false;
    return Boolean(await db.agent.findFirst({where: {id: message.agentId, managerProfileId: user.managerId}}));
  }
  return false;
}
async function verifiedConnection(req: Request): Promise<SavedConnection> {
  let c: SavedConnection;
  if (req.params.connectionId) c = await CarrierStore.getById(req.params.connectionId);
  else {
    if (!req.params.providerId) throw new Error('Provider ID required');
    const adapter = req.path.includes('/twilio/') ? 'twilio' : req.path.includes('/telnyx/') ? 'telnyx' : 'sinch';
    const matches = (await CarrierStore.list(req.params.providerId)).filter(c => c.config.mode === 'LIVE' && c.config.adapter === adapter && c.config.enabled);
    if (matches.length !== 1) throw new Error('Use the connection-specific callback URL');
    c = await CarrierStore.getById(matches[0].id);
  }
  if (c.config.mode !== 'LIVE' || !c.config.enabled) throw new Error('Live callback is disabled');
  const raw = (req as any).rawBody || Buffer.alloc(0);
  const secret = c.secrets.webhookSecret || '';
  let verified = false;
  switch (c.config.webhookAuth) {
    case 'hmac': verified = Boolean(secret) && validateHmac(secret, req.get('X-Webhook-Timestamp') || '', raw, req.get('X-Webhook-Signature') || ''); break;
    case 'bearer': verified = Boolean(secret) && constantEqual(req.get('Authorization') || '', `Bearer ${secret}`); break;
    case 'telnyx': verified = validateTelnyx(c.config.webhookPublicKey, req.get('telnyx-timestamp') || '', raw, req.get('telnyx-signature-ed25519') || ''); break;
    case 'twilio': {
      const base = process.env.CARRIER_PUBLIC_BASE_URL;
      if (!base || !base.startsWith('https://')) throw new Error('Configure CARRIER_PUBLIC_BASE_URL to the exact public HTTPS origin');
      verified = Boolean(secret) && validateTwilio(secret, base.replace(/\/$/, '') + req.originalUrl, req.body, req.get('X-Twilio-Signature') || ''); break;
    }
  }
  if (!verified) throw new Error('Invalid webhook authentication');
  return c;
}
export class CarrierController {
  static async list(req: Request, res: Response) {
    try { sendSuccess(res, {connections: (await CarrierStore.list(req.params.id)).map(publicConnection)}, 'Connections retrieved'); }
    catch { sendError(res, 503, 'CONNECTIONS_UNAVAILABLE', 'Unable to load carrier connections'); }
  }
  static async save(req: Request, res: Response) {
    try {
      const connection = await CarrierStore.save(req.params.id, req.body, req.params.connectionId);
      await AuditService.recordEvent({userId: req.user?.id, email: req.user?.email, action: 'CARRIER_CONNECTION_SAVED', entityType: 'PROVIDER_CONNECTION', entityId: connection.id, reason: `${connection.mode} ${connection.connectionType} configuration saved; credentials omitted from audit`});
      sendSuccess(res, {connection}, 'Connection saved');
    } catch (error: any) {
      const message = error instanceof z.ZodError ? 'Invalid connection fields; check protocol, mode and field limits' : error.message;
      sendError(res, 400, 'CONNECTION_CONFIG_ERROR', message);
    }
  }
  static async send(req: Request, res: Response) {
    try {
      const payload = outboundSchema.parse(req.body);
      const c = await CarrierStore.getById(req.params.connectionId);
      if (c.providerId !== req.params.id) throw new Error('Connection/provider mismatch');
      const result = await sendCarrier(c, payload.from, payload.to, payload.body, payload.idempotencyKey);
      sendSuccess(res, result, c.config.mode === 'DEMO' ? 'Demo submission simulated' : 'Carrier submission processed');
    } catch (error: any) { sendError(res, 400, 'SUBMISSION_ERROR', error instanceof z.ZodError ? 'Invalid message fields' : error.message); }
  }
  static async test(req: Request, res: Response) {
    try {
      const list = await CarrierStore.list(req.params.id);
      const id = String(req.query.connectionId || req.params.connectionId || '');
      const c = id ? list.find(c => c.id === id) : list[0];
      if (!c) throw new Error('Connection not found');
      sendSuccess(res, await testCarrier(c), 'Connection test completed');
    } catch (error: any) { sendError(res, 400, 'CONNECTION_TEST_FAILED', error.message); }
  }
  static async callback(req: Request, res: Response) {
    let c: SavedConnection;
    try { c = await verifiedConnection(req); }
    catch { sendError(res, 401, 'INVALID_CALLBACK', 'Callback authentication failed or connection disabled'); return; }
    try {
      const payload = req.body;
      let from: unknown, to: unknown, body: unknown, id: unknown;
      if (c.config.adapter === 'twilio') {
        if (payload.MessageStatus || payload.SmsStatus && !payload.Body) {
          await recordReceipt(c, z.string().min(1).parse(payload.MessageSid || payload.SmsSid), z.string().min(1).parse(payload.MessageStatus || payload.SmsStatus));
          res.sendStatus(204); return;
        }
        from = payload.From; to = payload.To; body = payload.Body; id = payload.MessageSid;
      } else if (c.config.adapter === 'telnyx') {
        const event = payload.data; const p = event?.payload;
        if (event?.event_type !== 'message.received') {
          if (event?.event_type === 'message.finalized' || event?.event_type === 'message.sent') {
            await recordReceipt(c, z.string().min(1).parse(p?.id), String(p?.to?.[0]?.status || event.event_type));
          }
          res.sendStatus(204); return;
        }
        from = p?.from?.phone_number; to = p?.to?.[0]?.phone_number; body = p?.text; id = p?.id;
      } else {
        if (payload.type === 'delivery_receipt') { await recordReceipt(c, z.string().min(1).parse(payload.id), z.string().min(1).parse(payload.status)); res.sendStatus(204); return; }
        from = payload[c.config.fromField]; to = payload[c.config.toField]; body = payload[c.config.bodyField]; id = payload.id || payload.providerMessageId;
      }
      const message = z.object({fromNumber: z.string().min(1).max(64), toNumber: z.string().min(1).max(32), body: z.string().max(40000).default(''), providerMessageId: z.string().min(1).max(255)}).parse({fromNumber: from, toNumber: to, body, providerMessageId: id});
      const result = await MessagingService.ingestInboundMessage({providerId: c.providerId, ...message});
      if (c.config.adapter === 'twilio') res.type('text/xml').send('<Response/>');
      else sendSuccess(res, {id: result.message.id, duplicate: result.duplicate}, 'Message accepted');
    } catch (error) {
      sendError(res, error instanceof z.ZodError ? 400 : 503, 'CALLBACK_NOT_ACCEPTED', 'Message could not be durably processed; provider retry required');
    }
  }
}
