import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации',
            details: errors,
          },
        });
        return;
      }
      next(error);
    }
  };
}

// Validation schemas
export const processMessageSchema = z.object({
  body: z.object({
    session_id: z.string().uuid('Некорректный формат session_id'),
    user_id: z.string().uuid('Некорректный формат user_id').optional(),
    message: z
      .string()
      .min(1, 'Сообщение не может быть пустым')
      .max(2000, 'Сообщение слишком длинное'),
  }),
});

export const clearContextSchema = z.object({
  params: z.object({
    session_id: z.string().uuid('Некорректный формат session_id'),
  }),
});
