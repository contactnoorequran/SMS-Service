import { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response';

export class TestRbacController {
  static publicEndpoint(_req: Request, res: Response): void {
    sendSuccess(res, { message: 'Public endpoint accessed successfully.' }, 'Public access granted', 200);
  }

  static authenticatedOnly(req: Request, res: Response): void {
    sendSuccess(res, {
      message: 'Authenticated endpoint accessed successfully.',
      user: req.user,
    }, 'Authenticated access granted', 200);
  }

  static superAdminOnly(req: Request, res: Response): void {
    sendSuccess(res, {
      message: 'Super Admin privileged endpoint accessed successfully.',
      user: req.user,
    }, 'Super Admin clearance granted', 200);
  }

  static managerLevel(req: Request, res: Response): void {
    sendSuccess(res, {
      message: 'Manager or Super Admin permission verified (numbers.assign).',
      user: req.user,
    }, 'Manager clearance granted', 200);
  }

  static billingManage(req: Request, res: Response): void {
    sendSuccess(res, {
      message: 'Billing management clearance verified (billing.manage).',
      user: req.user,
    }, 'Billing clearance granted', 200);
  }

  static clientApiManage(req: Request, res: Response): void {
    sendSuccess(res, {
      message: 'API management clearance verified (api.manage).',
      user: req.user,
    }, 'API manage clearance granted', 200);
  }
}
