import { Request, Response } from 'express';
import { z } from 'zod';
import { UserRepository } from '../services/user.repository';
import { PermissionsService } from '../services/permissions.service';
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

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const),
});

export class UsersController {
  /**
   * GET /api/users
   * Scoped user listing based on actor role.
   */
  static async list(req: Request, res: Response): Promise<void> {
    const actor = req.user!;
    const users = await UserRepository.listUsers(actor.role.name, actor.id);
    sendSuccess(res, { users, count: users.length }, 'Users retrieved successfully', 200);
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

      sendSuccess(res, { user: newUser }, 'User successfully created', 201);
    } catch (err: any) {
      sendError(res, 400, 'CREATE_USER_FAILED', err.message || 'Failed to create user');
    }
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
    sendSuccess(res, { user: updated }, `User status updated to ${validation.data.status}`, 200);
  }
}
