import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { successResponse } from '@cars/shared';

const chatService = new ChatService();

export class SessionsController {
  async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || null;
      const { title } = req.body;

      const session = await chatService.createSession(userId, title);

      res.status(201).json(successResponse(session));
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const sessions = await chatService.getSessions(userId);

      res.status(200).json(successResponse(sessions));
    } catch (error) {
      next(error);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { sessionId } = req.params;

      const session = await chatService.getSession(sessionId, userId);

      res.status(200).json(successResponse(session));
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { sessionId } = req.params;

      await chatService.deleteSession(sessionId, userId);

      res.status(200).json(successResponse({ message: 'Session deleted' }));
    } catch (error) {
      next(error);
    }
  }
}
