import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  preferredBudgetMinRub?: number;
  preferredBudgetMaxRub?: number;
  preferredBodyType?: string;
  preferredFuelType?: string;
  city?: string;
}

export class UserApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.services.user,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('User API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await this.client.get(`/api/users/${userId}/profile`);
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserProfile>
  ): Promise<void> {
    try {
      await this.client.patch(`/api/users/${userId}/preferences`, preferences);
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }
}
