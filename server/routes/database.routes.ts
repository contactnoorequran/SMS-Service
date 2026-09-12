import { Router } from 'express';
import { getDatabaseArchitecture } from '../controllers/database.controller';

export const databaseRouter = Router();

databaseRouter.get('/architecture', getDatabaseArchitecture);
