import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';
import { CreateClientDTO, UpdateClientDTO, ConfigureClientApiDTO } from '../types/client';
import { AuthTokenPayload } from '../types/auth';

export class ClientController {
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
   * GET /api/clients
   * Lists clients with search, status/manager/agent/billing filters, and pagination.
   * Scoped by actor role:
   * - Super Admin sees all clients
   * - Manager sees only clients in their scope
   * - Agent sees only clients in their portfolio
   * - Client sees only their own account
   */
  static async listClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const {
        search,
        status,
        managerId,
        agentId,
        billingType,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortDir = 'desc',
      } = req.query;

      const result = await ClientService.listClients(
        {
          search: typeof search === 'string' ? search : undefined,
          status: typeof status === 'string' ? status : undefined,
          managerId: typeof managerId === 'string' ? managerId : undefined,
          agentId: typeof agentId === 'string' ? agentId : undefined,
          billingType: typeof billingType === 'string' ? billingType : undefined,
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
   * GET /api/clients/:id
   * Retrieves single client full details.
   */
  static async getClientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;

      const client = await ClientService.getClientById(id, actor);

      res.status(200).json({
        success: true,
        data: client,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/clients
   * Creates a new client.
   */
  static async createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const body = req.body as CreateClientDTO;

      if (!body.email || !body.username || !body.firstName || !body.lastName || !body.companyName || !body.contact) {
        res.status(400).json({
          success: false,
          error: 'Validation failed: username, firstName, lastName, email, companyName, and contact are required.',
        });
        return;
      }

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await ClientService.createClient(body, actor, meta);

      res.status(201).json({
        success: true,
        message: 'Client created successfully.',
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('Validation')) {
        res.status(400).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * PUT /api/clients/:id
   * Updates an existing client profile.
   */
  static async updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;
      const body = req.body as UpdateClientDTO;

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const updated = await ClientService.updateClient(id, body, actor, meta);

      res.status(200).json({
        success: true,
        message: 'Client profile updated successfully.',
        data: updated,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * PATCH /api/clients/:id/status
   * Enables, disables, or suspends a client.
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
        res.status(400).json({
          success: false,
          error: "Invalid status: Must be 'ACTIVE', 'SUSPENDED', or 'PENDING'.",
        });
        return;
      }

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const normalizedStatus = status === 'INACTIVE' ? 'SUSPENDED' : status;
      const result = await ClientService.updateStatus(id, normalizedStatus, reason, actor, meta);

      res.status(200).json({
        success: true,
        message: `Client status updated to ${normalizedStatus}.`,
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/clients/:id/reset-password
   * Resets password for a client.
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;
      const { newPassword, autoGenerate } = req.body || {};

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await ClientService.resetPassword(
        id,
        { newPassword, autoGenerate: autoGenerate !== false },
        actor,
        meta
      );

      res.status(200).json({
        success: true,
        message: 'Client password reset completed successfully.',
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
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
   * PUT /api/clients/:id/permissions
   * Updates granular security permissions for a client.
   */
  static async updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
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

      const result = await ClientService.updatePermissions(id, permissions, actor, meta);

      res.status(200).json({
        success: true,
        message: 'Client permissions updated successfully.',
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * POST /api/clients/:id/api-access
   * Configures REST API key and access parameters for client.
   */
  static async configureApiAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;
      const body = req.body as ConfigureClientApiDTO;

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const result = await ClientService.configureApiAccess(id, body, actor, meta);

      res.status(200).json({
        success: true,
        message: 'Client API access credentials configured successfully.',
        data: result,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/clients/:id/dashboard (and /me/dashboard)
   * Retrieves full client dashboard metrics.
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;

      const dashboard = await ClientService.getDashboardData(id, actor);

      res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/clients/:id/numbers
   * Retrieves phone number inventory assigned to client.
   */
  static async getNumbers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;

      const numbers = await ClientService.getNumbers(id, actor);

      res.status(200).json({
        success: true,
        data: numbers,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/clients/:id/statistics
   * Retrieves SMS performance statistics for the client.
   */
  static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;

      const stats = await ClientService.getStatistics(id, actor);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/clients/:id/balance
   * Retrieves balance and credit ledger details for the client.
   */
  static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;

      const balance = await ClientService.getBalance(id, actor);

      res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/clients/:id/activity
   * Retrieves audit activity logs for the client.
   */
  static async getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = ClientController.getActor(req);
      const { id } = req.params;

      const activity = await ClientService.getActivity(id, actor);

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        res.status(404).json({ success: false, error: err.message });
        return;
      }
      if (err.message?.includes('Forbidden') || err.message?.includes('scope') || err.message?.includes('denied')) {
        res.status(403).json({ success: false, error: err.message });
        return;
      }
      next(err);
    }
  }
}
