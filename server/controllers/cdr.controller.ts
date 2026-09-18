import { Request, Response } from 'express';
import { CdrService } from '../services/cdr.service';
import { sendSuccess, sendError } from '../utils/api-response';

export class CdrController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { providerId, clientId, agentId, numberId, page, limit } = req.query;

      // Scoping
      let effectiveClientId = clientId ? String(clientId) : undefined;
      let effectiveAgentId = agentId ? String(agentId) : undefined;

      if (req.user?.role.name === 'CLIENT' && req.user.clientId) {
        effectiveClientId = req.user.clientId;
      } else if (req.user?.role.name === 'AGENT' && req.user.agentId) {
        effectiveAgentId = req.user.agentId;
      }

      const result = await CdrService.listCdrs({
        providerId: providerId ? String(providerId) : undefined,
        clientId: effectiveClientId,
        agentId: effectiveAgentId,
        numberId: numberId ? String(numberId) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      });

      sendSuccess(res, result, 'CDRs retrieved successfully');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list CDRs');
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const cdr = await CdrService.getCdrById(req.params.id);
      if (!cdr) {
        sendError(res, 404, 'NOT_FOUND', `CDR '${req.params.id}' not found`);
        return;
      }

      if (req.user?.role.name === 'CLIENT' && req.user.clientId && cdr.clientId !== req.user.clientId) {
        sendError(res, 403, 'FORBIDDEN', 'Access denied to CDR outside your client account');
        return;
      }

      sendSuccess(res, { cdr }, 'CDR details retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to get CDR');
    }
  }

  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { providerId, clientId } = req.query;
      let effectiveClientId = clientId ? String(clientId) : undefined;
      if (req.user?.role.name === 'CLIENT' && req.user.clientId) {
        effectiveClientId = req.user.clientId;
      }

      const summary = await CdrService.getCdrSummary({
        providerId: providerId ? String(providerId) : undefined,
        clientId: effectiveClientId,
      });

      sendSuccess(res, { summary }, 'CDR summary metrics retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to get CDR summary');
    }
  }
}
