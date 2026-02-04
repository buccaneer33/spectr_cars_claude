"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const shared_1 = require("@cars/shared");
const profileService = new profile_service_1.ProfileService();
class ProfileController {
    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await profileService.getProfile(userId);
            res.status(200).json((0, shared_1.successResponse)(profile));
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const { name, avatarUrl, ...profileData } = req.body;
            // Обновляем информацию пользователя (name, avatarUrl)
            if (name !== undefined || avatarUrl !== undefined) {
                await profileService.updateUserInfo(userId, { name, avatarUrl });
            }
            // Обновляем профиль (остальные данные)
            const profile = await profileService.updateProfile(userId, profileData);
            res.status(200).json((0, shared_1.successResponse)(profile));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProfileController = ProfileController;
