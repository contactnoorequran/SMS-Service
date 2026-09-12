import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { UserRepository } from '../services/user.repository';
import { PermissionsService } from '../services/permissions.service';
import { SafeUser, UserRole } from '../types/auth';
import { sendError } from '../utils/api-response';

// Augment Express Request interface with authenticated user properties
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      token?: string;
      tokenId?: string;
    }
  }
}

/**
 * Middleware that validates the JWT Bearer token and attaches the authenticated user.
 * Returns 401 for missing, invalid, expired, or revoked tokens.
 * Returns 403 for suspended or inactive accounts.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(
      res,
      401,
      'UNAUTHORIZED',
      'Authentication required. Please provide a valid Bearer token in the Authorization header.'
    );
    return;
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    sendError(res, 401, 'UNAUTHORIZED', 'Malformed Authorization header.');
    return;
  }

  const verification = TokenService.verifyTokenDetailed(token);
  if (!verification.valid || !verification.payload) {
    if (verification.expired) {
      sendError(
        res,
        401,
        'TOKEN_EXPIRED',
        'Authentication failed: Token is expired. Please refresh or re-authenticate.'
      );
      return;
    }
    sendError(res, 401, 'INVALID_TOKEN', 'Authentication failed: Token is invalid or revoked.');
    return;
  }

  const payload = verification.payload;

  const user = await UserRepository.findById(payload.userId);
  if (!user) {
    sendError(res, 401, 'USER_NOT_FOUND', 'Authenticated user account no longer exists.');
    return;
  }

  // Account Status Check
  if (user.status === 'SUSPENDED') {
    sendError(
      res,
      403,
      'ACCOUNT_SUSPENDED',
      'Account suspended: Your account is currently suspended. Please contact platform administration.'
    );
    return;
  }

  if (user.status === 'PENDING') {
    sendError(
      res,
      403,
      'ACCOUNT_PENDING',
      'Account pending: Your account is pending activation.'
    );
    return;
  }

  // Attach verified user and token context
  req.user = user;
  req.token = token;
  req.tokenId = payload.tokenId;

  next();
}

/**
 * Optional authentication middleware: if Bearer token is provided and valid, attaches user;
 * otherwise proceeds without failing.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    next();
    return;
  }

  const payload = TokenService.verifyToken(token);
  if (!payload) {
    next();
    return;
  }

  const user = await UserRepository.findById(payload.userId);
  if (user && user.status === 'ACTIVE') {
    req.user = user;
    req.token = token;
    req.tokenId = payload.tokenId;
  }

  next();
}

/**
 * Middleware factory that enforces granular permission checking.
 * Checks permissions separately from role names.
 * Super Admin inherits wildcard '*' bypass.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required prior to permission evaluation.');
      return;
    }

    const hasAccess = PermissionsService.hasPermission(req.user.permissions, permission);
    if (!hasAccess) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Forbidden: Insufficient permissions. Required permission: '${permission}'.`
      );
      return;
    }

    next();
  };
}

/**
 * Middleware factory that enforces strict role membership.
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required prior to role evaluation.');
      return;
    }

    // Super Admin always satisfies any role requirement
    if (req.user.role.name === 'SUPER_ADMIN' || rolesArray.includes(req.user.role.name)) {
      next();
      return;
    }

    sendError(
      res,
      403,
      'ROLE_RESTRICTED',
      `Forbidden: Access restricted to roles: [${rolesArray.join(', ')}]. Current role: '${req.user.role.name}'.`
    );
  };
}
