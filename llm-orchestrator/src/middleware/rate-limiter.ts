import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';

const RATE_LIMIT_WINDOW = 60; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per user

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const identifier = req.body.session_id || req.ip || 'unknown';
    const key = `ratelimit:${identifier}`;

    const redis = await getRedisClient();
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= MAX_REQUESTS_PER_WINDOW) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count,
        limit: MAX_REQUESTS_PER_WINDOW,
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Слишком много запросов. Попробуйте через минуту.',
        },
      });
      return;
    }

    // Increment counter
    await redis
      .multi()
      .incr(key)
      .expire(key, RATE_LIMIT_WINDOW)
      .exec();

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - count - 1);
    res.setHeader('X-RateLimit-Reset', Date.now() + RATE_LIMIT_WINDOW * 1000);

    next();
  } catch (error) {
    logger.error('Rate limiter error:', error);
    // On error, allow the request through (fail open)
    next();
  }
}
