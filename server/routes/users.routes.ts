import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';

export const usersRouter = Router();

usersRouter.use(authenticate);

// Protected user management routes
usersRouter.get('/', requirePermission('users.view'), UsersController.list);
usersRouter.post('/', requirePermission('users.create'), UsersController.create);
usersRouter.patch('/:id/status', requirePermission('users.disable'), UsersController.updateStatus);
