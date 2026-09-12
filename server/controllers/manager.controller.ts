import { Request, Response } from 'express';
import { z } from 'zod';
import { ManagerService } from '../services/manager.service';
import { AuthTokenPayload, UserStatus } from '../types/auth';
import { sendSuccess, sendError } from '../utils/api-response';

const createManagerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username must contain only alphanumeric characters, dots, underscores, or hyphens'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email address is required'),
  contact: z.string().min(5, 'Contact phone number must be at least 5 characters').max(30),
  department: z.string().min(2, 'Department is required').max(60),
  maxAgents: z.coerce.number().int().min(1).max(500).default(50),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const).default('ACTIVE'),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  permissions: z.array(z.string()).optional(),
});

const updateManagerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username must contain only alphanumeric characters, dots, underscores, or hyphens')
    .optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  contact: z.string().min(5).max(30).optional(),
  department: z.string().min(2).max(60).optional(),
  maxAgents: z.coerce.number().int().min(1).max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'] as const),
  reason: z.string().max(255).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  autoGenerate: z.boolean().optional(),
});

const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

export class ManagerController {
  private static getActor(req: Request): AuthTokenPayload {
    const user = req.user!;
    return {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      status: user.status,
      tokenId: req.tokenId || 'token-id',
    };
  }

  private static getMeta(req: Request) {
    return {
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown Client',
    };
  }

  /**
   * GET /api/managers
   * List managers with search, status filters, and pagination.
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'ALL';
      const department = (req.query.department as string) || 'ALL';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as any) || 'createdAt';
      const sortDir = ((req.query.sortDir as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

      const result = await ManagerService.listManagers({
        search,
        status,
        department,
        page,
        limit,
        sortBy,
        sortDir,
      });

      sendSuccess(res, result, 'Managers retrieved successfully', 200);
    } catch (err: any) {
      sendError(res, 500, 'LIST_MANAGERS_FAILED', err.message || 'Failed to list managers');
    }
  }

  /**
   * GET /api/managers/:id
   * Retrieve full details of a specific manager.
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const manager = await ManagerService.getManagerById(id);

      if (!manager) {
        sendError(res, 404, 'NOT_FOUND', `Manager with ID '${id}' not found`);
        return;
      }

      sendSuccess(res, { manager }, 'Manager details retrieved successfully', 200);
    } catch (err: any) {
      sendError(res, 500, 'GET_MANAGER_FAILED', err.message || 'Failed to retrieve manager details');
    }
  }

  /**
   * POST /api/managers
   * Create a new manager account.
   */
  static async create(req: Request, res: Response): Promise<void> {
    const actor = ManagerController.getActor(req);

    const validation = createManagerSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed creating manager', validation.error.format());
      return;
    }

    try {
      const { manager, generatedPassword } = await ManagerService.createManager(
        validation.data,
        actor,
        ManagerController.getMeta(req)
      );

      sendSuccess(
        res,
        { manager, generatedPassword },
        'Manager created successfully. One-time credentials generated.',
        201
      );
    } catch (err: any) {
      sendError(res, 400, 'CREATE_MANAGER_FAILED', err.message || 'Failed to create manager');
    }
  }

  /**
   * PUT /api/managers/:id
   * Update manager profile information.
   */
  static async update(req: Request, res: Response): Promise<void> {
    const actor = ManagerController.getActor(req);
    const id = req.params.id;

    const validation = updateManagerSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed updating manager', validation.error.format());
      return;
    }

    try {
      const updated = await ManagerService.updateManager(
        id,
        validation.data,
        actor,
        ManagerController.getMeta(req)
      );

      sendSuccess(res, { manager: updated }, 'Manager profile updated successfully', 200);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      sendError(res, status, 'UPDATE_MANAGER_FAILED', err.message || 'Failed to update manager');
    }
  }

  /**
   * PATCH /api/managers/:id/status
   * Enable, disable, or suspend a manager account.
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    const actor = ManagerController.getActor(req);
    const id = req.params.id;

    const validation = updateStatusSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed for status update', validation.error.format());
      return;
    }

    try {
      const updated = await ManagerService.updateStatus(
        id,
        validation.data.status as UserStatus,
        validation.data.reason,
        actor,
        ManagerController.getMeta(req)
      );

      sendSuccess(
        res,
        { manager: updated },
        `Manager account status updated to '${validation.data.status}'`,
        200
      );
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      sendError(res, status, 'UPDATE_STATUS_FAILED', err.message || 'Failed to update manager status');
    }
  }

  /**
   * POST /api/managers/:id/reset-password
   * Securely reset manager password.
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    const actor = ManagerController.getActor(req);
    const id = req.params.id;

    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid password reset options', validation.error.format());
      return;
    }

    try {
      const result = await ManagerService.resetPassword(
        id,
        {
          newPassword: validation.data.newPassword,
          autoGenerate: validation.data.autoGenerate,
        },
        actor,
        ManagerController.getMeta(req)
      );

      sendSuccess(
        res,
        result,
        'Password reset successfully. Secure credentials generated.',
        200
      );
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      sendError(res, status, 'RESET_PASSWORD_FAILED', err.message || 'Failed to reset password');
    }
  }

  /**
   * PUT /api/managers/:id/permissions
   * Assign or update granular permissions for a manager.
   */
  static async updatePermissions(req: Request, res: Response): Promise<void> {
    const actor = ManagerController.getActor(req);
    const id = req.params.id;

    const validation = updatePermissionsSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid permissions payload', validation.error.format());
      return;
    }

    try {
      const updated = await ManagerService.updatePermissions(
        id,
        validation.data.permissions,
        actor,
        ManagerController.getMeta(req)
      );

      sendSuccess(res, { manager: updated }, 'Manager permissions updated successfully', 200);
    } catch (err: any) {
      const status = err.message.includes('not found') ? 404 : 400;
      sendError(res, status, 'UPDATE_PERMISSIONS_FAILED', err.message || 'Failed to update permissions');
    }
  }

  /**
   * GET /api/managers/:id/agents
   * View all agents assigned to this manager.
   */
  static async getAgents(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const manager = await ManagerService.getManagerById(id);
      if (!manager) {
        sendError(res, 404, 'NOT_FOUND', `Manager with ID '${id}' not found`);
        return;
      }
      sendSuccess(res, { agents: manager.agents, count: manager.agents.length }, 'Manager agents retrieved', 200);
    } catch (err: any) {
      sendError(res, 500, 'GET_AGENTS_FAILED', err.message || 'Failed to retrieve manager agents');
    }
  }

  /**
   * GET /api/managers/:id/clients
   * View all clients assigned to this manager.
   */
  static async getClients(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const manager = await ManagerService.getManagerById(id);
      if (!manager) {
        sendError(res, 404, 'NOT_FOUND', `Manager with ID '${id}' not found`);
        return;
      }
      sendSuccess(res, { clients: manager.clients, count: manager.clients.length }, 'Manager clients retrieved', 200);
    } catch (err: any) {
      sendError(res, 500, 'GET_CLIENTS_FAILED', err.message || 'Failed to retrieve manager clients');
    }
  }

  /**
   * GET /api/managers/:id/activity
   * View manager activity and audit trail.
   */
  static async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const manager = await ManagerService.getManagerById(id);
      if (!manager) {
        sendError(res, 404, 'NOT_FOUND', `Manager with ID '${id}' not found`);
        return;
      }
      sendSuccess(
        res,
        { activity: manager.recentActivity, count: manager.recentActivity.length },
        'Manager activity retrieved',
        200
      );
    } catch (err: any) {
      sendError(res, 500, 'GET_ACTIVITY_FAILED', err.message || 'Failed to retrieve manager activity');
    }
  }

  /**
   * GET /api/managers/departments
   * Get list of all distinct departments.
   */
  static async getDepartments(_req: Request, res: Response): Promise<void> {
    try {
      const departments = await ManagerService.getDepartments();
      sendSuccess(res, { departments }, 'Departments retrieved', 200);
    } catch (err: any) {
      sendError(res, 500, 'GET_DEPARTMENTS_FAILED', err.message || 'Failed to retrieve departments');
    }
  }

  /**
   * GET /api/managers/available-permissions
   * Get system permissions available to assign.
   */
  static async getAvailablePermissions(_req: Request, res: Response): Promise<void> {
    try {
      const permissions = ManagerService.getAvailablePermissions();
      sendSuccess(res, { permissions }, 'Available permissions retrieved', 200);
    } catch (err: any) {
      sendError(res, 500, 'GET_PERMISSIONS_FAILED', err.message || 'Failed to retrieve permissions');
    }
  }
}
