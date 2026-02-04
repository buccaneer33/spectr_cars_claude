import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { authMiddleware, optionalAuth, validateBody } from '@cars/shared';
import { createSessionSchema } from '../validators/chat.validator';

const router = Router();
const sessionsController = new SessionsController();

router.post('/', optionalAuth, validateBody(createSessionSchema), (req, res, next) =>
  sessionsController.createSession(req, res, next)
);
router.get('/', authMiddleware, (req, res, next) =>
  sessionsController.getSessions(req, res, next)
);
router.get('/:sessionId', authMiddleware, (req, res, next) =>
  sessionsController.getSession(req, res, next)
);
router.delete('/:sessionId', authMiddleware, (req, res, next) =>
  sessionsController.deleteSession(req, res, next)
);

export default router;
