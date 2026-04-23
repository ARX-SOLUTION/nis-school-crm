import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Valid email required' }).max(150),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(128),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
