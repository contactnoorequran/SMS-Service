import { loadProductionProfiles } from './server/services/production-store';
import { startCarrierRuntime, stopCarrierRuntime } from './server/services/carrier-runtime';
import { captureRawBody } from './server/controllers/carrier.controller';
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
import { smppManager } from './server/services/smpp.service';

async function startServer() {
  await loadProductionProfiles();
  const app = express();
  app.disable('x-powered-by');
  if (env.NODE_ENV === 'production') app.set('trust proxy', 'loopback');
  const PORT = env.PORT;

  // Middleware pipeline for API requests
  app.use(express.json({ limit: '2mb', verify: captureRawBody }));
  app.use(express.urlencoded({ extended: true, limit: '2mb', verify: captureRawBody }));
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

  startCarrierRuntime();
  const server = app.listen(PORT, process.env.BIND_HOST || (env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0'), () => {
    logger.info(`🚀 SMS Service server listening on port ${PORT} [${env.NODE_ENV}]`);
    logger.info(`👉 API Health Endpoint: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    stopCarrierRuntime();
    server.close(async () => {
      try {
        smppManager.shutdown();
      } catch (e) {
        logger.error('Error shutting down SMPP sessions:', e);
      }
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
