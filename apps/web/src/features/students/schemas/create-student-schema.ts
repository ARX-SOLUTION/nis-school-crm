import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  middleName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  gender: z
    .enum(['MALE', 'FEMALE'] as const)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  gradeLevel: z.coerce.number().int().min(1).max(11),
  classId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  parentFullName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  parentPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  parentTelegram: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;
