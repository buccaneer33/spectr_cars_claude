import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';

const CONTEXT_TTL = 24 * 60 * 60; // 24 hours
const MAX_MESSAGES = 20; // Keep last 20 messages

export class ContextService {
  private getKey(sessionId: string): string {
    return `chat:${sessionId}:history`;
  }

  async getHistory(sessionId: string): Promise<ChatCompletionMessageParam[]> {
    try {
      const redis = await getRedisClient();
      const data = await redis.get(this.getKey(sessionId));

      if (!data) return [];

      const messages = JSON.parse(data);
      return messages.slice(-MAX_MESSAGES);
    } catch (error) {
      logger.error('Error getting context from Redis:', error);
      return [];
    }
  }

  async addMessage(
    sessionId: string,
    message: ChatCompletionMessageParam
  ): Promise<void> {
    try {
      const redis = await getRedisClient();
      const history = await this.getHistory(sessionId);
      history.push(message);

      const trimmedHistory = history.slice(-MAX_MESSAGES);

      await redis.setEx(
        this.getKey(sessionId),
        CONTEXT_TTL,
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      logger.error('Error saving context to Redis:', error);
    }
  }

  async addMessages(
    sessionId: string,
    messages: ChatCompletionMessageParam[]
  ): Promise<void> {
    try {
      const redis = await getRedisClient();
      const history = await this.getHistory(sessionId);
      history.push(...messages);

      const trimmedHistory = history.slice(-MAX_MESSAGES);

      await redis.setEx(
        this.getKey(sessionId),
        CONTEXT_TTL,
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      logger.error('Error saving messages to Redis:', error);
    }
  }

  async clearHistory(sessionId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.del(this.getKey(sessionId));
      logger.info('Context cleared', { sessionId });
    } catch (error) {
      logger.error('Error clearing context from Redis:', error);
    }
  }

  async getMessageCount(sessionId: string): Promise<number> {
    const history = await this.getHistory(sessionId);
    return history.length;
  }
}
