import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { successResponse } from '@cars/shared';

const profileService = new ProfileService();

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const profile = await profileService.getProfile(userId);

      res.status(200).json(successResponse(profile));
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { name, avatarUrl, ...profileData } = req.body;

      // Обновляем информацию пользователя (name, avatarUrl)
      if (name !== undefined || avatarUrl !== undefined) {
        await profileService.updateUserInfo(userId, { name, avatarUrl });
      }

      // Обновляем профиль (остальные данные)
      const profile = await profileService.updateProfile(userId, profileData);

      res.status(200).json(successResponse(profile));
    } catch (error) {
      next(error);
    }
  }
}
