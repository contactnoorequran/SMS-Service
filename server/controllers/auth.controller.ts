import { Request, Response } from 'express';
import { z } from 'zod';
import { UserRepository } from '../services/user.repository';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { AuditService } from '../services/audit.service';
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, ROLE_HIERARCHY_WEIGHT } from '../services/permissions.service';
import { sendSuccess, sendError } from '../utils/api-response';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  /**
   * POST /api/auth/login
   * Authenticates credentials, audits attempt, verifies account status, and issues signed JWT.
   */
  static async login(req: Request, res: Response): Promise<void> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Client';

    // 1. Input Validation
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid login input data.', validation.error.format());
      return;
    }

    const { email, password } = validation.data;

    // Ensure seed users are initialized
    await UserRepository.initializeSeedUsers();

    // 2. Lookup user record
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      await AuditService.recordEvent({
        email,
        action: 'LOGIN_FAILED',
        reason: 'User account not found',
        ipAddress,
        userAgent,
      });

      sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
      return;
    }

    // 3. Verify password hash (zero plaintext comparison)
    const isPasswordValid = await PasswordService.verify(password, user.passwordHash);
    if (!isPasswordValid) {
      await AuditService.recordEvent({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        reason: 'Incorrect password entered',
        ipAddress,
        userAgent,
      });

      sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
      return;
    }

    // 4. Account Status Enforcement
    if (user.status === 'SUSPENDED') {
      await AuditService.recordEvent({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        reason: 'Attempted login to suspended account',
        ipAddress,
        userAgent,
      });

      sendError(
        res,
        403,
        'ACCOUNT_SUSPENDED',
        'Account is suspended. Access is revoked. Please contact system administrators.'
      );
      return;
    }

    if (user.status === 'PENDING') {
      await AuditService.recordEvent({
        userId: user.id,
        email: user.email,
        action: 'LOGIN_FAILED',
        reason: 'Attempted login to pending account',
        ipAddress,
        userAgent,
      });

      sendError(
        res,
        403,
        'ACCOUNT_PENDING',
        'Account is pending administrative approval.'
      );
      return;
    }

    // 5. Generate secure JWT token
    const { token, expiresIn, tokenId } = TokenService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      status: user.status,
    });

    // 6. Update last login timestamp
    await UserRepository.updateLastLogin(user.id);

    // 7. Audit successful login
    await AuditService.recordEvent({
      userId: user.id,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      reason: 'Authenticated successfully',
      ipAddress,
      userAgent,
      metadata: { tokenId, role: user.role.name },
    });

    const safeUser = UserRepository.toSafeUser(user);

    sendSuccess(res, {
      user: safeUser,
      token,
      expiresIn,
    }, 'Authentication successful', 200);
  }

  /**
   * POST /api/auth/refresh
   * Seamlessly refreshes an active or recently-expired session.
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1]?.trim() : null;
    if (!token && req.body?.token) {
      token = String(req.body.token).trim();
    }

    if (!token) {
      sendError(res, 401, 'TOKEN_MISSING', 'Bearer token or token parameter required for session refresh.');
      return;
    }

    const refreshResult = await TokenService.refreshToken(token);
    if (!refreshResult) {
      sendError(res, 401, 'REFRESH_FAILED', 'Unable to refresh session. Please re-authenticate.');
      return;
    }

    sendSuccess(res, {
      user: refreshResult.user,
      token: refreshResult.token,
      expiresIn: refreshResult.expiresIn,
    }, 'Session refreshed successfully', 200);
  }

  /**
   * POST /api/auth/logout
   * Invalidates current token ID and logs audit event.
   */
  static async logout(req: Request, res: Response): Promise<void> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Client';

    if (req.tokenId) {
      TokenService.revokeToken(req.tokenId);
    }

    if (req.user) {
      await AuditService.recordEvent({
        userId: req.user.id,
        email: req.user.email,
        action: 'LOGOUT',
        reason: 'User explicitly logged out',
        ipAddress,
        userAgent,
      });
    }

    sendSuccess(res, { revoked: true }, 'Session successfully invalidated and logged out.', 200);
  }

  /**
   * GET /api/auth/me
   * Returns authenticated user profile, role, and effective permissions.
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
      return;
    }

    sendSuccess(res, {
      user: req.user,
    }, 'Current user profile retrieved', 200);
  }

  /**
   * GET /api/auth/permissions
   * Returns system permission catalog and role matrices.
   */
  static async getPermissionsCatalog(req: Request, res: Response): Promise<void> {
    sendSuccess(res, {
      allPermissions: ALL_PERMISSIONS,
      roleHierarchy: ROLE_HIERARCHY_WEIGHT,
      defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
      currentUserPermissions: req.user?.permissions || [],
    }, 'Permissions catalog retrieved', 200);
  }
}
