import { Request, Response, NextFunction } from 'express';
import { ApiError, sendError } from '../utils/api-response';
import { Logger } from '../utils/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

const errorLogger = new Logger('ErrorHandler');

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
  // If response headers are already sent, delegate to Express default handler
  if (res.headersSent) {
    return;
  }

  // Handle our custom ApiError
  if (err instanceof ApiError) {
    errorLogger.warn(`Operational error: [${err.errorCode}] ${err.message}`, {
      path: req.originalUrl,
      method: req.method,
      details: err.details,
    });

    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedDetails = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    errorLogger.warn(`Validation error on ${req.method} ${req.originalUrl}`, formattedDetails);
    sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', formattedDetails);
    return;
  }

  // Handle unknown/unhandled exceptions
  const message = err instanceof Error ? err.message : 'An unexpected internal error occurred';
  const stack = err instanceof Error ? err.stack : undefined;

  errorLogger.error(`Unhandled exception on ${req.method} ${req.originalUrl}: ${message}`, {
    stack,
  });

  const errorDetails = env.NODE_ENV === 'development' ? { stack } : undefined;
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error', errorDetails);
}
