import express, { Express } from 'express';
import { apiRouter } from './routes';
import { requestLogger } from './middlewares/request-logger';
import { errorHandler } from './middlewares/error-handler';

// Ensure BigInt can be serialized to JSON across all endpoints
if (typeof (BigInt.prototype as any).toJSON !== 'function') {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

export function createExpressApp(): Express {
  const app = express();

  // Middleware pipeline
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(requestLogger);

  // Mount API Router
  app.use('/api', apiRouter);

  // Centralized Error Handling Middleware for API
  app.use(errorHandler);

  return app;
}
