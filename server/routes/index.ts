import { Router } from 'express';
import { healthRouter } from './health.routes';
import { databaseRouter } from './database.routes';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { managerRouter } from './manager.routes';
import agentRouter from './agent.routes';
import clientRouter from './client.routes';
import { auditRouter } from './audit.routes';
import { demoRouter } from './demo.routes';
import { dashboardRouter } from './dashboard.routes';
import { notificationsRouter } from './notifications.routes';
import { notFoundHandler } from '../middlewares/not-found';
import { sendSuccess } from '../utils/api-response';
import { APP_CONFIG } from '../config/constants';

export const apiRouter = Router();

// Root API information endpoint
apiRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    name: APP_CONFIG.name,
    version: APP_CONFIG.version,
    currentPhase: 'PHASE_07_CLIENT_MANAGEMENT',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard/stats',
      notifications: '/api/notifications',
      databaseArchitecture: '/api/database/architecture',
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        currentUser: 'GET /api/auth/me',
        permissions: 'GET /api/auth/permissions',
      },
      managers: {
        list: 'GET /api/managers',
        create: 'POST /api/managers',
        getById: 'GET /api/managers/:id',
        update: 'PUT /api/managers/:id',
        updateStatus: 'PATCH /api/managers/:id/status',
        resetPassword: 'POST /api/managers/:id/reset-password',
        updatePermissions: 'PUT /api/managers/:id/permissions',
        agents: 'GET /api/managers/:id/agents',
        clients: 'GET /api/managers/:id/clients',
        activity: 'GET /api/managers/:id/activity',
        departments: 'GET /api/managers/departments',
        availablePermissions: 'GET /api/managers/available-permissions',
      },
      agents: {
        list: 'GET /api/agents',
        create: 'POST /api/agents',
        getById: 'GET /api/agents/:id',
        update: 'PUT /api/agents/:id',
        updateStatus: 'PATCH /api/agents/:id/status',
        resetPassword: 'POST /api/agents/:id/reset-password',
        updatePermissions: 'PUT /api/agents/:id/permissions',
        assignManager: 'PATCH /api/agents/:id/assign-manager',
        clients: 'GET /api/agents/:id/clients',
        numbers: 'GET /api/agents/:id/numbers',
        statistics: 'GET /api/agents/:id/statistics',
        activity: 'GET /api/agents/:id/activity',
      },
      clients: {
        list: 'GET /api/clients',
        create: 'POST /api/clients',
        getById: 'GET /api/clients/:id',
        update: 'PUT /api/clients/:id',
        updateStatus: 'PATCH /api/clients/:id/status',
        resetPassword: 'POST /api/clients/:id/reset-password',
        updatePermissions: 'PUT /api/clients/:id/permissions',
        apiAccess: 'POST /api/clients/:id/api-access',
        dashboard: 'GET /api/clients/:id/dashboard',
        numbers: 'GET /api/clients/:id/numbers',
        statistics: 'GET /api/clients/:id/statistics',
        balance: 'GET /api/clients/:id/balance',
        activity: 'GET /api/clients/:id/activity',
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        updateStatus: 'PATCH /api/users/:id/status',
      },
      auditLogs: 'GET /api/audit-logs',
      demoRbac: {
        public: 'GET /api/demo/public',
        authenticated: 'GET /api/demo/authenticated',
        adminOnly: 'GET /api/demo/admin-only',
        managerPermission: 'GET /api/demo/manager-permission',
        billingManage: 'GET /api/demo/billing-manage',
        clientApiManage: 'GET /api/demo/client-api-manage',
      },
    },
    documentation: 'Phase 07 Client Management operational.',
  });
});

// Mount modules
apiRouter.use('/health', healthRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/database', databaseRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/managers', managerRouter);
apiRouter.use('/agents', agentRouter);
apiRouter.use('/clients', clientRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/demo', demoRouter);

// Catch-all 404 for unknown API routes
apiRouter.use(notFoundHandler);


