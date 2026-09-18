import { Request, Response } from 'express';
import { z } from 'zod';
import { NumberService } from '../services/number.service';
import { sendSuccess, sendError } from '../utils/api-response';

const assignNumberSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
});

const reassignNumberSchema = z.object({
  newClientId: z.string().min(1, 'newClientId is required'),
});

const releaseNumberSchema = z.object({
  reason: z.string().optional(),
});

const createRangeSchema = z.object({
  startE164: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Invalid start E.164 phone number'),
  endE164: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Invalid end E.164 phone number'),
  countryId: z.string().min(1, 'countryId is required'),
  providerId: z.string().min(1, 'providerId is required'),
  operatorId: z.string().optional(),
});

export class NumberController {
  static async listCountries(_req: Request, res: Response): Promise<void> {
    try {
      const countries = await NumberService.listCountries();
      sendSuccess(res, { countries }, 'Countries retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list countries');
    }
  }

  static async listOperators(req: Request, res: Response): Promise<void> {
    try {
      const countryId = req.query.countryId ? String(req.query.countryId) : undefined;
      const operators = await NumberService.listOperators(countryId);
      sendSuccess(res, { operators }, 'Operators retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list operators');
    }
  }

  static async listRanges(req: Request, res: Response): Promise<void> {
    try {
      const { countryId, providerId } = req.query;
      const ranges = await NumberService.listRanges({
        countryId: countryId ? String(countryId) : undefined,
        providerId: providerId ? String(providerId) : undefined,
      });
      sendSuccess(res, { ranges }, 'Ranges retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list ranges');
    }
  }

  static async createRange(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createRangeSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid range data', parsed.error.format());
        return;
      }
      const range = await NumberService.createRange(parsed.data);
      sendSuccess(res, { range }, 'Range created successfully', 201);
    } catch (err: any) {
      sendError(res, 400, 'RANGE_ERROR', err.message || 'Failed to create range');
    }
  }

  static async listNumbers(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, countryId, operatorId, providerId, clientId, page, limit } = req.query;
      const result = await NumberService.listNumbers({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        countryId: countryId ? String(countryId) : undefined,
        operatorId: operatorId ? String(operatorId) : undefined,
        providerId: providerId ? String(providerId) : undefined,
        clientId: clientId ? String(clientId) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      });
      sendSuccess(res, result, 'Numbers retrieved successfully');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list numbers');
    }
  }

  static async getNumberById(req: Request, res: Response): Promise<void> {
    try {
      const number = await NumberService.getNumberById(req.params.id);
      if (!number) {
        sendError(res, 404, 'NOT_FOUND', `Number '${req.params.id}' not found`);
        return;
      }
      sendSuccess(res, { number }, 'Number details retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to get number');
    }
  }

  static async assignNumber(req: Request, res: Response): Promise<void> {
    try {
      const parsed = assignNumberSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid assignment payload', parsed.error.format());
        return;
      }

      const number = await NumberService.assignNumber({
        numberId: req.params.id,
        clientId: parsed.data.clientId,
        actorEmail: req.user?.email,
        actorId: req.user?.id,
      });

      sendSuccess(res, { number }, 'Number assigned successfully');
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 400;
      sendError(res, status, 'ASSIGNMENT_ERROR', err.message || 'Failed to assign number');
    }
  }

  static async reassignNumber(req: Request, res: Response): Promise<void> {
    try {
      const parsed = reassignNumberSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid reassignment payload', parsed.error.format());
        return;
      }

      const number = await NumberService.reassignNumber({
        numberId: req.params.id,
        newClientId: parsed.data.newClientId,
        actorEmail: req.user?.email,
        actorId: req.user?.id,
      });

      sendSuccess(res, { number }, 'Number reassigned successfully');
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 400;
      sendError(res, status, 'REASSIGNMENT_ERROR', err.message || 'Failed to reassign number');
    }
  }

  static async releaseNumber(req: Request, res: Response): Promise<void> {
    try {
      const parsed = releaseNumberSchema.safeParse(req.body);
      const number = await NumberService.releaseNumber({
        numberId: req.params.id,
        reason: parsed.success ? parsed.data.reason : undefined,
        actorEmail: req.user?.email,
        actorId: req.user?.id,
      });

      sendSuccess(res, { number }, 'Number released successfully');
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 400;
      sendError(res, status, 'RELEASE_ERROR', err.message || 'Failed to release number');
    }
  }

  static async getNumberHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await NumberService.getNumberHistory(req.params.id);
      sendSuccess(res, { history }, 'Number assignment history retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to get number history');
    }
  }
}
