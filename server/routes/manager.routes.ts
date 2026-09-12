import { Router } from 'express';
import { ManagerController } from '../controllers/manager.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

export const managerRouter = Router();

// All manager management routes require valid authentication and SUPER_ADMIN role
managerRouter.use(authenticate);
managerRouter.use(requireRole('SUPER_ADMIN'));

// Static utility endpoints
managerRouter.get('/departments', ManagerController.getDepartments);
managerRouter.get('/available-permissions', ManagerController.getAvailablePermissions);

// Collection operations
managerRouter.get('/', ManagerController.list);
managerRouter.post('/', ManagerController.create);

// Individual manager operations
managerRouter.get('/:id', ManagerController.getById);
managerRouter.put('/:id', ManagerController.update);
managerRouter.patch('/:id/status', ManagerController.updateStatus);
managerRouter.post('/:id/reset-password', ManagerController.resetPassword);
managerRouter.put('/:id/permissions', ManagerController.updatePermissions);

// Sub-resources
managerRouter.get('/:id/agents', ManagerController.getAgents);
managerRouter.get('/:id/clients', ManagerController.getClients);
managerRouter.get('/:id/activity', ManagerController.getActivity);
