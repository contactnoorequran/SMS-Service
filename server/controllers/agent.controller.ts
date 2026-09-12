import { Request, Response, NextFunction } from 'express';
import { AgentService } from '../services/agent.service';
import { CreateAgentDTO, UpdateAgentDTO } from '../types/agent';
import { AuthTokenPayload } from '../types/auth';

export class AgentController {
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

  /**
   * GET /api/agents
   * Lists agents with search, status/manager filters, and pagination.
   * Scoped by actor role:
   * - Super Admin sees all agents
   * - Manager sees only agents in their scope
   * - Agent sees only their own profile
   */
  static async listAgents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const {
        search,
        status,
        managerId,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortDir = 'desc',
      } = req.query;

      const result = await AgentService.listAgents(
        {
          search: typeof search === 'string' ? search : undefined,
          status: typeof status === 'string' ? status : undefined,
          managerId: typeof managerId === 'string' ? managerId : undefined,
          page: parseInt(page as string, 10) || 1,
          limit: parseInt(limit as string, 10) || 10,
          sortBy: sortBy as any,
          sortDir: sortDir as any,
        },
        actor
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/agents/:id
   * Retrieves single agent full details.
   */
  static async getAgentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;

      const agent = await AgentService.getAgentById(id, actor);

      res.status(200).json({
        success: true,
        data: {
          agent,
          ...agent,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/agents
   * Creates a new agent.
   */
  static async createAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const body = req.body as CreateAgentDTO;

      if (!body.email || !body.username || !body.firstName || !body.lastName) {
        res.status(400).json({
          success: false,
          error: 'Validation failed: username, firstName, lastName, and email are required.',
        });
        return;
      }

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await AgentService.createAgent(body, actor, meta);

      res.status(201).json({
        success: true,
        message: 'Agent created successfully.',
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('Validation')) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * PUT /api/agents/:id
   * Updates an existing agent profile.
   */
  static async updateAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;
      const body = req.body as UpdateAgentDTO;

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const updated = await AgentService.updateAgent(id, body, actor, meta);

      res.status(200).json({
        success: true,
        message: 'Agent profile updated successfully.',
        data: {
          agent: updated,
          ...updated,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * PATCH /api/agents/:id/status
   * Enables, disables, or suspends an agent.
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({
          success: false,
          error: "Invalid status: Must be 'ACTIVE', 'INACTIVE', or 'SUSPENDED'.",
        });
        return;
      }

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await AgentService.updateStatus(id, status, reason, actor, meta);

      res.status(200).json({
        success: true,
        message: `Agent status updated to ${status}.`,
        data: {
          agent: result,
          ...result,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/agents/:id/reset-password
   * Resets password for an agent.
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;
      const { newPassword, autoGenerate } = req.body || {};

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await AgentService.resetPassword(
        id,
        { newPassword, autoGenerate: autoGenerate !== false },
        actor,
        meta
      );

      res.status(200).json({
        success: true,
        message: 'Agent password reset completed successfully.',
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Password must be')) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * PUT /api/agents/:id/permissions
   * Updates granular security permissions for an agent.
   */
  static async updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        res.status(400).json({
          success: false,
          error: "Invalid payload: 'permissions' must be an array of permission codes.",
        });
        return;
      }

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await AgentService.updatePermissions(id, permissions, actor, meta);

      res.status(200).json({
        success: true,
        message: 'Agent permissions updated successfully.',
        data: {
          agent: result,
          ...result,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * PATCH /api/agents/:id/assign-manager
   * Assigns an agent to a manager (Super Admin only).
   */
  static async assignManager(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;
      const { managerId } = req.body;

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await AgentService.assignManager(id, managerId || null, actor, meta);

      res.status(200).json({
        success: true,
        message: 'Agent manager assignment updated successfully.',
        data: {
          agent: result,
          ...result,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found') || err.message?.includes('does not exist')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/agents/:id/clients
   * Retrieves clients assigned to the agent.
   */
  static async getClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;

      const clients = await AgentService.getClients(id, actor);

      res.status(200).json({
        success: true,
        data: {
          clients,
          items: clients,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/agents/:id/numbers
   * Retrieves phone number inventory for the agent.
   */
  static async getNumbers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;

      const numbers = await AgentService.getNumbers(id, actor);

      res.status(200).json({
        success: true,
        data: {
          numbers,
          items: numbers,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/agents/:id/statistics
   * Retrieves performance statistics for the agent.
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;

      const stats = await AgentService.getStatistics(id, actor);

      res.status(200).json({
        success: true,
        data: {
          statistics: stats,
          stats,
          ...stats,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/agents/:id/activity
   * Retrieves audit activity logs for the agent.
   */
  static async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = AgentController.getActor(req);
      const { id } = req.params;

      const activity = await AgentService.getActivity(id, actor);

      res.status(200).json({
        success: true,
        data: {
          activity,
          activities: activity,
          items: activity,
        },
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }
}
