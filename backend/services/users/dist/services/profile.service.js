"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const client_1 = require("@prisma/client");
const shared_1 = require("@cars/shared");
const prisma = new client_1.PrismaClient();
class ProfileService {
    async getProfile(userId) {
        const profile = await prisma.userProfile.findUnique({
            where: { userId },
        });
        return profile;
    }
    async updateProfile(userId, data) {
        // Проверяем существование пользователя
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new shared_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
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
        return profile;
    }
    async updateUserInfo(userId, data) {
        await prisma.user.update({
            where: { id: userId },
            data,
        });
    }
}
exports.ProfileService = ProfileService;
