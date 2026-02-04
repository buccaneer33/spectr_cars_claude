import { Router } from 'express';
import { MessagesController } from '../controllers/messages.controller';
import { optionalAuth, authMiddleware, validateBody } from '@cars/shared';
import { sendMessageSchema } from '../validators/chat.validator';

const router = Router();
const messagesController = new MessagesController();

router.get('/:sessionId/messages', authMiddleware, (req, res, next) =>
  messagesController.getMessages(req, res, next)
);
router.post('/:sessionId/messages', optionalAuth, validateBody(sendMessageSchema), (req, res, next) =>
  messagesController.sendMessage(req, res, next)
);
router.delete('/:sessionId/messages', authMiddleware, (req, res, next) =>
  messagesController.clearMessages(req, res, next)
);

export default router;
