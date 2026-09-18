import { Request, Response } from 'express';
import { z } from 'zod';
import { UserRepository } from '../services/user.repository';
import { PermissionsService } from '../services/permissions.service';
import { AuditService } from '../services/audit.service';
import { UserRole, UserStatus } from '../types/auth';
import { sendSuccess, sendError } from '../utils/api-response';

const createUserSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'AGENT', 'CLIENT'] as const),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const).default('ACTIVE'),
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Valid email address is required').optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const),
});

export class UsersController {
  /**
   * GET /api/users
   * Scoped user listing based on actor role with optional filtering and pagination.
   */
  static async list(req: Request, res: Response): Promise<void> {
    const actor = req.user!;
    let users = await UserRepository.listUsers(actor.role.name, actor.id);

    // Query & Role filter
    const query = typeof req.query.query === 'string' ? req.query.query.toLowerCase().trim() : '';
    const role = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : '';

    if (query) {
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          (u.firstName && u.firstName.toLowerCase().includes(query)) ||
          (u.lastName && u.lastName.toLowerCase().includes(query))
      );
    }
    if (role) {
      users = users.filter((u) => u.role.name === role);
    }
    if (status) {
      users = users.filter((u) => u.status === status);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 50));
    const total = users.length;
    const paginated = users.slice((page - 1) * limit, page * limit);

    sendSuccess(res, { items: paginated, total, page, limit, count: paginated.length }, 'Users retrieved successfully', 200);
  }

  /**
   * GET /api/users/:id
   * Get single user detail.
   */
  static async getById(req: Request, res: Response): Promise<void> {
    const actor = req.user!;
    const targetUserId = req.params.id;

    const user = await UserRepository.findById(targetUserId);
    if (!user) {
      sendError(res, 404, 'NOT_FOUND', 'Target user not found');
      return;
    }

    // Role scoping check
    if (actor.role.name === 'CLIENT' && actor.id !== targetUserId) {
      sendError(res, 403, 'FORBIDDEN', 'Access denied to target user profile');
      return;
    }

    sendSuccess(res, { user }, 'User retrieved successfully', 200);
  }

  /**
   * POST /api/users
   * Creates a new user with strict anti-escalation validation.
   */
  static async create(req: Request, res: Response): Promise<void> {
    const actor = req.user!;

    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation error creating user', validation.error.format());
      return;
    }

    const data = validation.data;

    // Security Check: Role Escalation Prevention
    const canAssign = PermissionsService.canAssignRole(actor.role.name, data.role as UserRole);
    if (!canAssign) {
      sendError(
        res,
        403,
        'ROLE_ESCALATION_DENIED',
        `Forbidden: Role escalation prevented. Role '${actor.role.name}' cannot create or assign users with role '${data.role}'.`
      );
      return;
    }

    try {
      const newUser = await UserRepository.createUser({
        email: data.email,
        passwordRaw: data.password,
        role: data.role as UserRole,
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status as UserStatus,
        managerId: actor.role.name === 'MANAGER' ? actor.id : null,
      });

      await AuditService.recordEvent({
        userId: actor.id,
        email: actor.email,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        metadata: { createdUserId: newUser.id, role: data.role, email: data.email },
      });

      sendSuccess(res, { user: newUser }, 'User successfully created', 201);
    } catch (err: any) {
      sendError(res, 400, 'CREATE_USER_FAILED', err.message || 'Failed to create user');
    }
  }

  /**
   * PUT /api/users/:id
   * Edit existing user profile.
   */
  static async update(req: Request, res: Response): Promise<void> {
    const actor = req.user!;
    const targetUserId = req.params.id;

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation error updating user', validation.error.format());
      return;
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      sendError(res, 404, 'NOT_FOUND', 'Target user not found');
      return;
    }

    // Role hierarchy check
    if (actor.id !== targetUserId && !PermissionsService.canModifyUser(actor.role.name, targetUser.role.name)) {
      sendError(res, 403, 'HIERARCHY_VIOLATION', `Forbidden: You cannot modify a user with role '${targetUser.role.name}'.`);
      return;
    }

    const updated = await UserRepository.updateUser(targetUserId, validation.data);
    if (!updated) {
      sendError(res, 500, 'UPDATE_FAILED', 'Failed to update user');
      return;
    }

    await AuditService.recordEvent({
      userId: actor.id,
      email: actor.email,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: targetUserId,
      metadata: { changes: validation.data },
    });

    sendSuccess(res, { user: updated }, 'User successfully updated', 200);
  }

  /**
   * PATCH /api/users/:id/status
   * Disables, suspends, or activates a user account.
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    const actor = req.user!;
    const targetUserId = req.params.id;

    if (actor.id === targetUserId) {
      sendError(res, 400, 'SELF_MODIFICATION_DENIED', 'Action prohibited: You cannot modify your own account status.');
      return;
    }

    const validation = updateStatusSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid status', validation.error.format());
      return;
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      sendError(res, 404, 'NOT_FOUND', 'Target user not found');
      return;
    }

    // Security Check: Role rank modification check
    const canModify = PermissionsService.canModifyUser(actor.role.name, targetUser.role.name);
    if (!canModify) {
      sendError(
        res,
        403,
        'HIERARCHY_VIOLATION',
        `Forbidden: You cannot modify a user with role '${targetUser.role.name}' (equal or higher rank).`
      );
      return;
    }

    const updated = await UserRepository.updateStatus(targetUserId, validation.data.status);

    await AuditService.recordEvent({
      userId: actor.id,
      email: actor.email,
      action: `USER_STATUS_${validation.data.status}`,
      entityType: 'USER',
      entityId: targetUserId,
      reason: `Status changed to ${validation.data.status}`,
      metadata: { targetUserId, newStatus: validation.data.status },
    });

    sendSuccess(res, { user: updated }, `User status updated to ${validation.data.status}`, 200);
  }
}
