import { Request, Response } from 'express';
import { z } from 'zod';
import { MessagingService } from '../services/messaging.service';
import { sendSuccess, sendError } from '../utils/api-response';

const inboundPayloadSchema = z.object({
  providerId: z.string().min(1, 'providerId is required'),
  providerMessageId: z.string().optional(),
  fromNumber: z.string().min(1, 'fromNumber is required'),
  toNumber: z.string().min(1, 'toNumber is required'),
  body: z.string().optional(),
  receivedAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export class MessagingController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        status,
        billingStatus,
        providerId,
        clientId,
        numberId,
        fromNumber,
        toNumber,
        page,
        limit,
      } = req.query;

      // Role Scoping: if CLIENT, restrict to own clientId
      let effectiveClientId = clientId ? String(clientId) : undefined;
      if (req.user?.role.name === 'CLIENT' && req.user.clientId) {
        effectiveClientId = req.user.clientId;
      }

      const result = await MessagingService.listMessages({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        billingStatus: billingStatus ? String(billingStatus) : undefined,
        providerId: providerId ? String(providerId) : undefined,
        clientId: effectiveClientId,
        numberId: numberId ? String(numberId) : undefined,
        fromNumber: fromNumber ? String(fromNumber) : undefined,
        toNumber: toNumber ? String(toNumber) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      });

      sendSuccess(res, result, 'Inbound messages retrieved successfully');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list messages');
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const message = await MessagingService.getMessageById(req.params.id);
      if (!message) {
        sendError(res, 404, 'NOT_FOUND', `Message '${req.params.id}' not found`);
        return;
      }

      // Role check for Client
      if (req.user?.role.name === 'CLIENT' && req.user.clientId && message.clientId !== req.user.clientId) {
        sendError(res, 403, 'FORBIDDEN', 'Access denied to message outside your client account');
        return;
      }

      sendSuccess(res, { message }, 'Message details retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to get message');
    }
  }

  static async ingest(req: Request, res: Response): Promise<void> {
    try {
      const parsed = inboundPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid inbound message payload', parsed.error.format());
        return;
      }

      const result = await MessagingService.ingestInboundMessage({
        providerId: parsed.data.providerId,
        providerMessageId: parsed.data.providerMessageId,
        fromNumber: parsed.data.fromNumber,
        toNumber: parsed.data.toNumber,
        body: parsed.data.body,
        receivedAt: parsed.data.receivedAt ? new Date(parsed.data.receivedAt) : undefined,
        metadata: parsed.data.metadata,
      });

      sendSuccess(res, result, result.duplicate ? 'Message already processed (idempotent duplicate)' : 'Message ingested and billed successfully', 201);
    } catch (err: any) {
      sendError(res, 400, 'INGESTION_ERROR', err.message || 'Failed to ingest message');
    }
  }
}
