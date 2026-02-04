import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware, validateBody } from '@cars/shared';
import { updateProfileSchema } from '../validators/auth.validator';

const router = Router();
const profileController = new ProfileController();

// GET /api/users/profile
router.get(
  '/profile',
  authMiddleware,
  (req, res, next) => profileController.getProfile(req, res, next)
);

// PUT /api/users/profile
router.put(
  '/profile',
  authMiddleware,
  validateBody(updateProfileSchema),
  (req, res, next) => profileController.updateProfile(req, res, next)
);

export default router;
