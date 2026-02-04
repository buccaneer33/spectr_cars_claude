import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferredBudgetMinRub: z.number().positive().optional(),
  preferredBudgetMaxRub: z.number().positive().optional(),
  preferredBodyTypeId: z.string().optional(),
  preferredFuelTypeId: z.string().optional(),
  cityId: z.string().optional(),
});
