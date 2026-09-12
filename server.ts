import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { requestLogger } from './server/middlewares/request-logger';
import { errorHandler } from './server/middlewares/error-handler';
import { logger } from './server/utils/logger';
import { disconnectDb } from './server/db/prisma';
import { env } from './server/config/env';
import { UserRepository } from './server/services/user.repository';
import { ClientService } from './server/services/client.service';

async function startServer() {
  // Initialize repository seed users, agents, and clients
  await UserRepository.initializeSeedUsers().catch((err) => {
    logger.warn('Seed users initialization encountered non-fatal warning:', err);
  });
  await ClientService.initializeSeedClients().catch((err) => {
    logger.warn('Seed clients initialization encountered non-fatal warning:', err);
  });

  const app = express();
  const PORT = 3000;

  // Middleware pipeline for API requests
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(requestLogger);

  // Mount API routes BEFORE Vite middleware
  app.use('/api', apiRouter);

  // Centralized Error Handling for API routes
  app.use(errorHandler);

  // Vite middleware integration for development & static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    logger.info('Vite development middleware mounted');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    logger.info('Production static file serving configured');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 SMS Management Platform server listening on port ${PORT} [${env.NODE_ENV}]`);
    logger.info(`👉 API Health Endpoint: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      await disconnectDb();
      logger.info('HTTP server and database connections closed. Exiting process.');
      process.exit(0);
    });

    // Force exit if hanging
    setTimeout(() => {
      logger.error('Forced exit timeout reached.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Fatal error starting server:', err);
  process.exit(1);
});
