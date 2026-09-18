import { Router } from 'express';
import { NumberController } from '../controllers/number.controller';
import { authenticate, requireRole, requirePermission } from '../middlewares/auth.middleware';

export const numberRouter = Router();

numberRouter.use(authenticate);

// Countries & Operators lookups
numberRouter.get('/countries', NumberController.listCountries);
numberRouter.get('/operators', NumberController.listOperators);

// Ranges
numberRouter.get('/ranges', requirePermission('ranges.view'), NumberController.listRanges);
numberRouter.post('/ranges', requireRole(['SUPER_ADMIN']), NumberController.createRange);

// Numbers inventory
numberRouter.get('/', requirePermission('numbers.view'), NumberController.listNumbers);
numberRouter.get('/:id', requirePermission('numbers.view'), NumberController.getNumberById);
numberRouter.get('/:id/history', requirePermission('numbers.view'), NumberController.getNumberHistory);

// Number assignments lifecycle
numberRouter.post('/:id/assign', requirePermission('numbers.assign'), NumberController.assignNumber);
numberRouter.post('/:id/reassign', requirePermission('numbers.assign'), NumberController.reassignNumber);
numberRouter.post('/:id/release', requirePermission('numbers.unassign'), NumberController.releaseNumber);
