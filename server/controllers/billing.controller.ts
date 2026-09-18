import { Request, Response } from 'express';
import { z } from 'zod';
import { BillingService } from '../services/billing.service';
import { sendSuccess, sendError } from '../utils/api-response';

const createRateSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND', 'DELIVERY_REPORT']),
  amountDecimal: z.number().positive('amountDecimal must be positive'),
  currency: z.string().default('USD'),
  providerId: z.string().optional(),
  clientId: z.string().optional(),
  countryId: z.string().optional(),
  operatorId: z.string().optional(),
  rangeId: z.string().optional(),
});

const adjustBalanceSchema = z.object({
  walletId: z.string().min(1, 'walletId is required'),
  amountDecimal: z.number().positive('amountDecimal must be positive'),
  type: z.enum(['CREDIT', 'DEBIT']),
  description: z.string().min(3, 'description is required'),
});

export class BillingController {
  static async listRates(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, providerId } = req.query;
      const rates = await BillingService.listRates({
        clientId: clientId ? String(clientId) : undefined,
        providerId: providerId ? String(providerId) : undefined,
      });
      sendSuccess(res, { rates }, 'Rates retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list rates');
    }
  }

  static async createRate(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createRateSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid rate payload', parsed.error.format());
        return;
      }
      const rate = await BillingService.createRate(parsed.data);
      sendSuccess(res, { rate }, 'Rate created successfully', 201);
    } catch (err: any) {
      sendError(res, 400, 'BILLING_ERROR', err.message || 'Failed to create rate');
    }
  }

  static async listWallets(_req: Request, res: Response): Promise<void> {
    try {
      const wallets = await BillingService.listWallets();
      sendSuccess(res, { wallets }, 'Wallets retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list wallets');
    }
  }

  static async getWalletLedger(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const ledger = await BillingService.getWalletLedger(req.params.id, limit);
      sendSuccess(res, { ledger }, 'Wallet ledger retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to get wallet ledger');
    }
  }

  static async adjustBalance(req: Request, res: Response): Promise<void> {
    try {
      const parsed = adjustBalanceSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, 'VALIDATION_ERROR', 'Invalid adjustment payload', parsed.error.format());
        return;
      }

      const result = await BillingService.adjustBalance({
        walletId: parsed.data.walletId,
        amountDecimal: parsed.data.amountDecimal,
        type: parsed.data.type,
        description: parsed.data.description,
        actorEmail: req.user?.email,
        actorId: req.user?.id,
      });

      sendSuccess(res, result, `Wallet balance ${parsed.data.type.toLowerCase()}ed successfully`);
    } catch (err: any) {
      sendError(res, 400, 'BILLING_ERROR', err.message || 'Failed to adjust balance');
    }
  }

  static async listPaymentRequests(req: Request, res: Response): Promise<void> {
    try {
      const { walletId, status } = req.query;
      const requests = await BillingService.listPaymentRequests({
        walletId: walletId ? String(walletId) : undefined,
        status: status ? String(status) : undefined,
      });
      sendSuccess(res, { requests }, 'Payment requests retrieved');
    } catch (err: any) {
      sendError(res, 500, 'INTERNAL_ERROR', err.message || 'Failed to list payment requests');
    }
  }

  static async createPaymentRequest(req: Request, res: Response): Promise<void> {
    try {
      const { walletId, amountDecimal, reason, reference } = req.body;
      if (!walletId || !amountDecimal || amountDecimal <= 0) {
        sendError(res, 400, 'VALIDATION_ERROR', 'walletId and positive amountDecimal are required');
        return;
      }

      const request = await BillingService.createPaymentRequest({
        walletId: String(walletId),
        requesterId: req.user!.id,
        amountDecimal: Number(amountDecimal),
        reason: reason ? String(reason) : undefined,
        reference: reference ? String(reference) : undefined,
        actorEmail: req.user?.email,
      });

      sendSuccess(res, { request }, 'Payment request created successfully', 201);
    } catch (err: any) {
      sendError(res, 400, 'PAYMENT_ERROR', err.message || 'Failed to create payment request');
    }
  }

  static async approvePaymentRequest(req: Request, res: Response): Promise<void> {
    try {
      const result = await BillingService.approvePaymentRequest({
        id: req.params.id,
        approverId: req.user!.id,
        approverRole: req.user!.role.name,
        approverEmail: req.user?.email,
      });
      sendSuccess(res, result, 'Payment request approved and wallet credited');
    } catch (err: any) {
      const status = err.message?.includes('Forbidden') ? 403 : err.message?.includes('not found') ? 404 : 400;
      sendError(res, status, 'APPROVAL_ERROR', err.message || 'Failed to approve payment request');
    }
  }

  static async rejectPaymentRequest(req: Request, res: Response): Promise<void> {
    try {
      const { reason } = req.body;
      const result = await BillingService.rejectPaymentRequest({
        id: req.params.id,
        approverId: req.user!.id,
        approverRole: req.user!.role.name,
        reason: reason ? String(reason) : undefined,
        approverEmail: req.user?.email,
      });
      sendSuccess(res, { request: result }, 'Payment request rejected');
    } catch (err: any) {
      const status = err.message?.includes('Forbidden') ? 403 : err.message?.includes('not found') ? 404 : 400;
      sendError(res, status, 'REJECTION_ERROR', err.message || 'Failed to reject payment request');
    }
  }
}
