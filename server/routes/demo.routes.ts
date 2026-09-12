import { Router } from 'express';
import { TestRbacController } from '../controllers/test-rbac.controller';
import { authenticate, requirePermission, requireRole } from '../middlewares/auth.middleware';

export const demoRouter = Router();

// Public endpoint (no auth required)
demoRouter.get('/public', TestRbacController.publicEndpoint);

// Authenticated endpoint (requires valid non-revoked Bearer token)
demoRouter.get('/authenticated', authenticate, TestRbacController.authenticatedOnly);

// Super Admin only (requires SUPER_ADMIN role)
demoRouter.get('/admin-only', authenticate, requireRole('SUPER_ADMIN'), TestRbacController.superAdminOnly);

// Manager permission requirement (requires 'numbers.assign')
demoRouter.get('/manager-permission', authenticate, requirePermission('numbers.assign'), TestRbacController.managerLevel);

// Billing permission requirement (requires 'billing.manage')
demoRouter.get('/billing-manage', authenticate, requirePermission('billing.manage'), TestRbacController.billingManage);

// Client API management requirement (requires 'api.manage')
demoRouter.get('/client-api-manage', authenticate, requirePermission('api.manage'), TestRbacController.clientApiManage);
