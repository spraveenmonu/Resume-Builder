import { z } from 'zod';
import { passwordSchema } from '../auth/schemas.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required to confirm email change'),
});

export const deleteAccountSchema = z.object({
  emailConfirmation: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, 'Password is required to confirm account deletion'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
