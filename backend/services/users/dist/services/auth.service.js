"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const shared_1 = require("@cars/shared");
const prisma = new client_1.PrismaClient();
class AuthService {
    async register(email, password, name) {
        // Проверяем существование пользователя
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new shared_1.AppError(400, 'EMAIL_EXISTS', 'Email already registered');
        }
        // Хешируем пароль
        const passwordHash = await (0, shared_1.hashPassword)(password);
        // Создаем пользователя с профилем
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: 'USER',
                status: 'ACTIVE',
                profile: {
                    create: {},
                },
            },
        });
        // Генерируем токен
        const token = (0, shared_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            user: this.mapUserToResponse(user),
            token,
        };
    }
    async login(email, password) {
        // Находим пользователя
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new shared_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        // Проверяем пароль
        const isValidPassword = await (0, shared_1.comparePassword)(password, user.passwordHash);
        if (!isValidPassword) {
            throw new shared_1.AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }
        // Проверяем статус
        if (user.status === 'BLOCKED') {
            throw new shared_1.AppError(403, 'USER_BLOCKED', 'Your account has been blocked');
        }
        // Генерируем токен
        const token = (0, shared_1.signToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            user: this.mapUserToResponse(user),
            token,
        };
    }
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new shared_1.AppError(404, 'USER_NOT_FOUND', 'User not found');
        }
        return this.mapUserToResponse(user);
    }
    mapUserToResponse(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
            status: user.status,
        };
    }
}
exports.AuthService = AuthService;
