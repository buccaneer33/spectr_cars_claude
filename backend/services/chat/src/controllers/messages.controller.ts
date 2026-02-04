import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { successResponse } from '@cars/shared';

const chatService = new ChatService();

export class MessagesController {
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { sessionId } = req.params;

      const messages = await chatService.getMessages(sessionId, userId);

      res.status(200).json(successResponse(messages));
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'anonymous';
      const { sessionId } = req.params;
      const { content } = req.body;

      const result = await chatService.sendMessage(sessionId, userId, content);

      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async clearMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { sessionId } = req.params;

      await chatService.clearMessages(sessionId, userId);

      res.status(200).json(successResponse({ message: 'Messages cleared' }));
    } catch (error) {
      next(error);
    }
  }
}
