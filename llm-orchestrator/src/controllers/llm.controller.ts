import { Request, Response, NextFunction } from 'express';
import { LLMService } from '../services/llm.service';
import { logger } from '../config/logger';
import { WELCOME_MESSAGE } from '../prompts/system';

export class LLMController {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  processMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { session_id, user_id, message } = req.body;

      logger.info('input: ', message);

      logger.info('Processing message', {
        sessionId: session_id,
        userId: user_id,
        messageLength: message?.length,
      });

      const result = await this.llmService.processMessage({
        sessionId: session_id,
        userId: user_id,
        message,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error processing message:', error);
      next(error);
    }
  };

  clearContext = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { session_id } = req.params;

      logger.info('Clearing context', { sessionId: session_id });

      await this.llmService.clearContext(`${session_id}`);

      res.json({
        success: true,
        data: { message: 'Контекст диалога очищен' },
      });
    } catch (error) {
      logger.error('Error clearing context:', error);
      next(error);
    }
  };

  getWelcomeMessage = async (
    _req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    res.json({
      success: true,
      data: {
        role: 'assistant',
        content: WELCOME_MESSAGE,
      },
    });
  };

  getContextLength = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { session_id } = req.params;

      const length = await this.llmService.getContextLength(`${session_id}`);

      res.json({
        success: true,
        data: {
          sessionId: session_id,
          messageCount: length,
        },
      });
    } catch (error) {
      logger.error('Error getting context length:', error);
      next(error);
    }
  };
}
