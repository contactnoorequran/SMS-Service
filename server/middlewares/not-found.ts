import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-response';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl} - Route not found on API`));
}
