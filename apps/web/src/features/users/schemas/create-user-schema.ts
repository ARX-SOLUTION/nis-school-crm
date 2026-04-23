import { z } from 'zod';
import { ROLE_NAMES } from '@nis/shared';

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Valid email required' }).max(150),
  fullName: z.string().trim().min(2).max(200),
  role: z.enum(['ADMIN', 'MANAGER', 'TEACHER'] as const, {
    errorMap: () => ({ message: 'Pick a role' }),
  }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  telegramUsername: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// Type assert so the union stays in sync with the shared enum.
export const SELECTABLE_ROLES = (['ADMIN', 'MANAGER', 'TEACHER'] as const).filter((r) =>
  ROLE_NAMES.includes(r),
);
