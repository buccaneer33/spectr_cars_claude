import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { successResponse } from '@cars/shared';

const chatService = new ChatService();

export class SearchResultsController {
  async saveResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { resultId } = req.params;

      const result = await chatService.saveSearchResult(resultId, userId);

      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getSavedResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const results = await chatService.getSavedResults(userId);

      res.status(200).json(successResponse(results));
    } catch (error) {
      next(error);
    }
  }

  async deleteResult(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { resultId } = req.params;

      await chatService.deleteSearchResult(resultId, userId);

      res.status(200).json(successResponse({ message: 'Search result deleted' }));
    } catch (error) {
      next(error);
    }
  }
}
