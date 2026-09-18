import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller';
import { authenticate, requireRole, requirePermission } from '../middlewares/auth.middleware';

export const providerRouter = Router();

// Authentication required for all provider operations
providerRouter.use(authenticate);

// View providers
providerRouter.get('/', requirePermission('providers.view'), ProviderController.list);
providerRouter.get('/:id', requirePermission('providers.view'), ProviderController.getById);

// Manage providers (Super Admin or users with providers.create / providers.update)
providerRouter.post('/', requireRole(['SUPER_ADMIN']), ProviderController.create);
providerRouter.put('/:id', requireRole(['SUPER_ADMIN']), ProviderController.update);
providerRouter.post('/:id/test-connection', requireRole(['SUPER_ADMIN', 'MANAGER']), ProviderController.testConnection);
