"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const shared_1 = require("@cars/shared");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, name } = req.body;
            const result = await authService.register(email, password, name);
            // Устанавливаем cookie с токеном
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(201).json((0, shared_1.successResponse)(result));
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            // Устанавливаем cookie с токеном
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(200).json((0, shared_1.successResponse)(result));
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            res.clearCookie('token');
            res.status(200).json((0, shared_1.successResponse)({ message: 'Logged out successfully' }));
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            const userId = req.user.userId;
            const user = await authService.getProfile(userId);
            res.status(200).json((0, shared_1.successResponse)(user));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
