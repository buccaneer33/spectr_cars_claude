import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message));
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json(errorResponse('DATABASE_ERROR', 'Database operation failed'));
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid or expired token'));
    return;
  }

  // Validation errors
  if (err.name === 'ZodError') {
    res.status(400).json(errorResponse('VALIDATION_ERROR', err.message));
    return;
  }

  // Default error
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
}
