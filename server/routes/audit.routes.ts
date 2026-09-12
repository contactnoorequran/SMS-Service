import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';

export const auditRouter = Router();

auditRouter.use(authenticate);

// Protected audit trail routes
auditRouter.get('/', requirePermission('audit.view'), AuditController.listLogs);
