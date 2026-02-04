import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody, authMiddleware } from '@cars/shared';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register
router.post(
  '/register',
  validateBody(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

// POST /api/auth/login
router.post(
  '/login',
  validateBody(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

// POST /api/auth/logout
router.post(
  '/logout',
  (req, res, next) => authController.logout(req, res, next)
);

// GET /api/auth/me
router.get(
  '/me',
  authMiddleware,
  (req, res, next) => authController.getMe(req, res, next)
);

export default router;
