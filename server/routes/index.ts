import { Router } from 'express';
import { healthRouter } from './health.routes';
import { databaseRouter } from './database.routes';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { managerRouter } from './manager.routes';
import agentRouter from './agent.routes';
import clientRouter from './client.routes';
import { providerRouter } from './provider.routes';
import { numberRouter } from './number.routes';
import { messagingRouter } from './messaging.routes';
import { cdrRouter } from './cdr.routes';
import { billingRouter } from './billing.routes';
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
    currentPhase: 'PHASE_40_ENTERPRISE_PRODUCTION_HARDENED',
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
      providers: {
        list: 'GET /api/providers',
        create: 'POST /api/providers',
        getById: 'GET /api/providers/:id',
        update: 'PUT /api/providers/:id',
        testConnection: 'POST /api/providers/:id/test-connection',
      },
      numbers: {
        countries: 'GET /api/numbers/countries',
        operators: 'GET /api/numbers/operators',
        ranges: 'GET /api/numbers/ranges',
        list: 'GET /api/numbers',
        getById: 'GET /api/numbers/:id',
        assign: 'POST /api/numbers/:id/assign',
        reassign: 'POST /api/numbers/:id/reassign',
        release: 'POST /api/numbers/:id/release',
        history: 'GET /api/numbers/:id/history',
      },
      messaging: {
        inbound: 'POST /api/messages/inbound',
        list: 'GET /api/messages',
        getById: 'GET /api/messages/:id',
      },
      cdr: {
        list: 'GET /api/cdr',
        getById: 'GET /api/cdr/:id',
        summary: 'GET /api/cdr/summary',
      },
      billing: {
        rates: 'GET /api/billing/rates',
        createRate: 'POST /api/billing/rates',
        wallets: 'GET /api/billing/wallets',
        walletLedger: 'GET /api/billing/wallets/:id/ledger',
        adjustBalance: 'POST /api/billing/wallets/adjust',
      },
      managers: {
        list: 'GET /api/managers',
        create: 'POST /api/managers',
        getById: 'GET /api/managers/:id',
        update: 'PUT /api/managers/:id',
        updateStatus: 'PATCH /api/managers/:id/status',
        resetPassword: 'POST /api/managers/:id/reset-password',
        updatePermissions: 'PUT /api/managers/:id/permissions',
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
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        updateStatus: 'PATCH /api/users/:id/status',
      },
      auditLogs: 'GET /api/audit-logs',
    },
    documentation: 'SMS Platform Enterprise Backend API Operational.',
  });
});

// Mount modules
apiRouter.use('/health', healthRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/database', databaseRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/providers', providerRouter);
apiRouter.use('/numbers', numberRouter);
apiRouter.use('/messages', messagingRouter);
apiRouter.use('/cdr', cdrRouter);
apiRouter.use('/billing', billingRouter);
apiRouter.use('/rates', billingRouter);
apiRouter.use('/wallets', billingRouter);
apiRouter.use('/managers', managerRouter);
apiRouter.use('/agents', agentRouter);
apiRouter.use('/clients', clientRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/demo', demoRouter);

// Catch-all 404 for unknown API routes
apiRouter.use(notFoundHandler);


