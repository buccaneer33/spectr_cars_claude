import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
});
