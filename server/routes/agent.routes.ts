import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All agent endpoints require valid authentication
router.use(authenticate);

// 1. List agents (Super Admin, Manager, Agent)
router.get('/', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), AgentController.listAgents);

// 2. Create agent (Super Admin, Manager)
router.post('/', requireRole(['SUPER_ADMIN', 'MANAGER']), AgentController.createAgent);

// 3. View agent details (Super Admin, Manager, Agent)
router.get('/:id', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), AgentController.getAgentById);

// 4. Update agent (Super Admin, Manager)
router.put('/:id', requireRole(['SUPER_ADMIN', 'MANAGER']), AgentController.updateAgent);

// 5. Update agent status: enable, disable, suspend (Super Admin, Manager)
router.patch('/:id/status', requireRole(['SUPER_ADMIN', 'MANAGER']), AgentController.updateStatus);

// 6. Reset password (Super Admin, Manager)
router.post('/:id/reset-password', requireRole(['SUPER_ADMIN', 'MANAGER']), AgentController.resetPassword);

// 7. Assign permissions (Super Admin, Manager)
router.put('/:id/permissions', requireRole(['SUPER_ADMIN', 'MANAGER']), AgentController.updatePermissions);

// 8. Assign agent to manager (Super Admin only)
router.patch('/:id/assign-manager', requireRole(['SUPER_ADMIN']), AgentController.assignManager);

// 9. View agent's clients (Super Admin, Manager, Agent)
router.get('/:id/clients', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), AgentController.getClients);

// 10. View agent's number inventory (Super Admin, Manager, Agent)
router.get('/:id/numbers', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), AgentController.getNumbers);

// 11. View agent statistics (Super Admin, Manager, Agent)
router.get('/:id/statistics', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), AgentController.getStatistics);

// 12. View agent activity audit logs (Super Admin, Manager, Agent)
router.get('/:id/activity', requireRole(['SUPER_ADMIN', 'MANAGER', 'AGENT']), AgentController.getActivity);

export default router;
