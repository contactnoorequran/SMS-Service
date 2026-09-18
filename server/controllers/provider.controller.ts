import { Request, Response } from 'express';
import { z } from 'zod';
import { ProviderService } from '../services/provider.service';
import { sendSuccess, sendError } from '../utils/api-response';

const createProviderSchema = z.object({
  name: z.string().min(2, 'Provider name must be at least 2 characters'),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']).optional(),
  connectionType: z.enum(['HTTP', 'SMPP']).optional(),
  protocolConfig: z.record(z.any()).optional(),
});

const updateProviderSchema = z.object({
  name: z.string().min(2, 'Provider name must be at least 2 characters').optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']).optional(),
});

export class ProviderController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, page, limit } = req.query;
      const result = await ProviderService.listProviders({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      });
      sendSuccess(res, result, 'Providers retrieved successfully');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list providers');
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const provider = await ProviderService.getProviderById(req.params.id);
      if (!provider) {
        sendError(res, 404, 'NOT_FOUND', `Provider with ID '${req.params.id}' not found`);
        return;
      }
      sendSuccess(res, { provider }, 'Provider details retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to get provider');
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createProviderSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid provider data', parsed.error.format());
        return;
      }

      const provider = await ProviderService.createProvider({
        ...parsed.data,
        actorEmail: req.user?.email,
        actorId: req.user?.id,
      });

      sendSuccess(res, { provider }, 'Provider created successfully', 201);
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to create provider');
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const parsed = updateProviderSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid update data', parsed.error.format());
        return;
      }

      const provider = await ProviderService.updateProvider(req.params.id, {
        ...parsed.data,
        actorEmail: req.user?.email,
        actorId: req.user?.id,
      });

      if (!provider) {
        sendError(res, 404, 'NOT_FOUND', `Provider with ID '${req.params.id}' not found`);
        return;
      }

      sendSuccess(res, { provider }, 'Provider updated successfully');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to update provider');
    }
  }

  static async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const connectionId = req.query.connectionId ? String(req.query.connectionId) : undefined;
      const result = await ProviderService.testConnection(req.params.id, connectionId);
      sendSuccess(res, result, 'Provider connection test completed');
    } catch (err: any) {
      sendError(res, 400, 'CONNECTION_ERROR', err.message || 'Failed to test connection');
    }
  }
}
