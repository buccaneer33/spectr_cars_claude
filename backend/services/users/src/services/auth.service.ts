import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  comparePassword,
  signToken,
  AppError,
  User,
  AuthResponse,
} from '@cars/shared';

const prisma = new PrismaClient();

export class AuthService {
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> {
    // Проверяем существование пользователя
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, 'EMAIL_EXISTS', 'Email already registered');
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

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
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.mapUserToResponse(user),
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Находим пользователя
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Проверяем пароль
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Проверяем статус
    if (user.status === 'BLOCKED') {
      throw new AppError(403, 'USER_BLOCKED', 'Your account has been blocked');
    }

    // Генерируем токен
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.mapUserToResponse(user),
      token,
    };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return this.mapUserToResponse(user);
  }

  private mapUserToResponse(user: any): User {
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
