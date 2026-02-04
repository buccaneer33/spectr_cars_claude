import { PrismaClient } from '@prisma/client';
import { AppError, UserProfile } from '@cars/shared';

const prisma = new PrismaClient();

function toUserProfile(profile: {
  userId: string;
  preferredBudgetMinRub: import('@prisma/client').Prisma.Decimal | null;
  preferredBudgetMaxRub: import('@prisma/client').Prisma.Decimal | null;
  preferredBodyTypeId: string | null;
  preferredFuelTypeId: string | null;
  cityId: string | null;
}): UserProfile {
  return {
    userId: profile.userId,
    preferredBudgetMinRub: profile.preferredBudgetMinRub ? Number(profile.preferredBudgetMinRub) : null,
    preferredBudgetMaxRub: profile.preferredBudgetMaxRub ? Number(profile.preferredBudgetMaxRub) : null,
    preferredBodyTypeId: profile.preferredBodyTypeId,
    preferredFuelTypeId: profile.preferredFuelTypeId,
    cityId: profile.cityId,
  };
}

export class ProfileService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    return profile ? toUserProfile(profile) : null;
  }

  async updateProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Обновляем профиль (upsert - создаст если не существует)
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    return toUserProfile(profile);
  }

  async updateUserInfo(
    userId: string,
    data: { name?: string; avatarUrl?: string }
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
