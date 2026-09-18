import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, requirePermission } from '../middlewares/auth.middleware';

export const usersRouter = Router();

usersRouter.use(authenticate);

// Protected user management routes
usersRouter.get('/', requirePermission('users.view'), UsersController.list);
usersRouter.get('/:id', requirePermission('users.view'), UsersController.getById);
usersRouter.post('/', requirePermission('users.create'), UsersController.create);
usersRouter.put('/:id', requirePermission('users.update'), UsersController.update);
usersRouter.patch('/:id/status', requirePermission('users.disable'), UsersController.updateStatus);
