import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(20),
  gradeLevel: z.coerce.number().int().min(1).max(11),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Use YYYY-YYYY'),
  maxStudents: z.coerce.number().int().min(1).max(60).optional(),
  roomNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type CreateClassFormValues = z.infer<typeof createClassSchema>;
