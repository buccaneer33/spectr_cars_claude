import { z } from 'zod';

export const searchFiltersSchema = z.object({
  budget_min: z.string().transform(Number).optional(),
  budget_max: z.string().transform(Number).optional(),
  brand: z.string().optional(),
  body_type: z.string().optional(),
  fuel_type: z.string().optional(),
  year_min: z.string().transform(Number).optional(),
  year_max: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});
