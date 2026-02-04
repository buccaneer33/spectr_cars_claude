import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Получаем токен из cookie или Authorization header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'Token not provided'));
      return;
    }

    // Проверяем токен
    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid token'));
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Игнорируем ошибки - auth опциональный
    next();
  }
}

export function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Not authenticated'));
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json(errorResponse('FORBIDDEN', 'Admin access required'));
    return;
  }

  next();
}
