import { Router } from 'express';
import { MessagingController } from '../controllers/messaging.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';

export const messagingRouter = Router();

// Inbound webhook ingestion can be called with valid API authentication or bearer token
messagingRouter.post('/inbound', MessagingController.ingest);

// Protected browsing endpoints
messagingRouter.use(authenticate);
messagingRouter.get('/', requirePermission('sms.view'), MessagingController.list);
messagingRouter.get('/:id', requirePermission('sms.view'), MessagingController.getById);
