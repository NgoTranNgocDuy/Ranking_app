import { z } from 'zod';

// Session validators
export const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
});

// Card validators
export const createCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(1000, 'Description is too long').optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
});

// Order update validator
export const updateOrderSchema = z.object({
  cardOrder: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid card ID')),
});

// Type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
