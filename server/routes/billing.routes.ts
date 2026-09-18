import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { authenticate, requireRole, requirePermission } from '../middlewares/auth.middleware';

export const billingRouter = Router();

billingRouter.use(authenticate);

// Rates
billingRouter.get('/rates', requirePermission('billing.view'), BillingController.listRates);
billingRouter.post('/rates', requireRole(['SUPER_ADMIN']), BillingController.createRate);

// Wallets
billingRouter.get('/wallets', requirePermission('billing.view'), BillingController.listWallets);
billingRouter.get('/wallets/:id/ledger', requirePermission('billing.view'), BillingController.getWalletLedger);
billingRouter.post('/wallets/adjust', requireRole(['SUPER_ADMIN']), BillingController.adjustBalance);

// Payment Requests & Credit Approval Flow
billingRouter.get('/payment-requests', requirePermission('billing.view'), BillingController.listPaymentRequests);
billingRouter.post('/payment-requests', requirePermission('billing.view'), BillingController.createPaymentRequest);
billingRouter.post('/payment-requests/:id/approve', requireRole(['SUPER_ADMIN', 'MANAGER']), BillingController.approvePaymentRequest);
billingRouter.post('/payment-requests/:id/reject', requireRole(['SUPER_ADMIN', 'MANAGER']), BillingController.rejectPaymentRequest);
