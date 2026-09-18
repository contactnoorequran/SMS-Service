import { Router } from 'express';
import { CdrController } from '../controllers/cdr.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';

export const cdrRouter = Router();

cdrRouter.use(authenticate);

// CDR requires reports.view or billing.view
cdrRouter.get('/summary', requirePermission('reports.view'), CdrController.getSummary);
cdrRouter.get('/', requirePermission('reports.view'), CdrController.list);
cdrRouter.get('/:id', requirePermission('reports.view'), CdrController.getById);
