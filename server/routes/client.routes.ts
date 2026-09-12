import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All client endpoints require valid authentication
router.use(authenticate);

// 1. Client self-service aliases (MUST precede /:id)
router.get(
  '/me/dashboard',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  (req, res, next) => {
    req.params.id = 'me';
    ClientController.getDashboard(req, res, next);
  }
);

router.get(
  '/me',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  (req, res, next) => {
    req.params.id = 'me';
    ClientController.getClientById(req, res, next);
  }
);

// 2. List clients (Super Admin, Manager, Agent, Client - scoped)
router.get('/', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']), ClientController.listClients);

// 3. Create client (Super Admin, Manager, Agent)
router.post('/', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), ClientController.createClient);

// 4. View client details (Super Admin, Manager, Agent, Client - scoped)
router.get('/:id', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']), ClientController.getClientById);

// 5. Update client details (Super Admin, Manager, Agent)
router.put('/:id', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), ClientController.updateClient);

// 6. Update client status: enable, disable, suspend (Super Admin, Manager, Agent)
router.patch('/:id/status', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), ClientController.updateStatus);

// 7. Reset client password (Super Admin, Manager, Agent)
router.post('/:id/reset-password', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), ClientController.resetPassword);

// 8. Configure client permissions (Super Admin, Manager)
router.put('/:id/permissions', requireRole(['SUPER_ADMIN', 'MANAGER']), ClientController.updatePermissions);

// 9. Configure API access / credentials (Super Admin, Manager, Agent, Client)
router.post(
  '/:id/api-access',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  ClientController.configureApiAccess
);

// 10. Client dashboard metrics (Super Admin, Manager, Agent, Client)
router.get(
  '/:id/dashboard',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  ClientController.getDashboard
);

// 11. View assigned phone numbers (Super Admin, Manager, Agent, Client)
router.get(
  '/:id/numbers',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  ClientController.getNumbers
);

// 12. View SMS statistics (Super Admin, Manager, Agent, Client)
router.get(
  '/:id/statistics',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  ClientController.getStatistics
);

// 13. View balance & ledger info (Super Admin, Manager, Agent, Client)
router.get(
  '/:id/balance',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  ClientController.getBalance
);

// 14. View activity audit logs (Super Admin, Manager, Agent, Client)
router.get(
  '/:id/activity',
  requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT']),
  ClientController.getActivity
);

export default router;
