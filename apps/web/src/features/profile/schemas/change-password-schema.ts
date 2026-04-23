import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(8, 'At least 8 characters').max(128),
    newPassword: z.string().min(12, 'At least 12 characters').max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((v) => v.newPassword !== v.oldPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one',
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
