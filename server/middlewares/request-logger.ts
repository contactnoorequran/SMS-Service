import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const httpLogger = new Logger('HTTP');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Only log API requests to avoid spamming Vite asset / HMR requests
  if (!req.url.startsWith('/api')) {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      httpLogger.error(logMessage);
    } else if (statusCode >= 400) {
      httpLogger.warn(logMessage);
    } else {
      httpLogger.info(logMessage);
    }
  });

  next();
}
