import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface SaveSearchResultPayload {
  summary: string;
  modelIds: string[];
}

export class ChatApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.services.chat,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Chat API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  async saveSearchResult(
    sessionId: string,
    payload: SaveSearchResultPayload
  ): Promise<void> {
    try {
      await this.client.post(`/api/chat/sessions/${sessionId}/results`, payload);
      logger.info('Search result saved', { sessionId, summary: payload.summary });
    } catch (error) {
      logger.error('Error saving search result:', error);
      throw error;
    }
  }

  async getSessionHistory(sessionId: string): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/api/chat/sessions/${sessionId}/messages`
      );
      return response.data.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      logger.error('Error getting session history:', error);
      throw error;
    }
  }
}
