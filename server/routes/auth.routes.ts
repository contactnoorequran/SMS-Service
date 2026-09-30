import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', AuthController.login);
authRouter.post('/register', AuthController.registerClient);
authRouter.post('/register-client', AuthController.registerClient);
authRouter.post('/refresh', AuthController.refreshToken);
authRouter.post('/logout', authenticate, AuthController.logout);
authRouter.get('/me', authenticate, AuthController.getCurrentUser);
authRouter.get('/permissions', AuthController.getPermissionsCatalog);
