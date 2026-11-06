import { z } from 'zod';
import { ROLES } from '../rbac/permissions';

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  tenantSlug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase with dashes').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().length(6, 'TOTP code must be 6 digits').optional(),
  tenantSlug: z.string().optional(),
});

export const EnableMfaSchema = z.object({
  token: z.string().length(6, 'Verification code must be 6 digits'),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(32),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
});

export const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type EnableMfaInput = z.infer<typeof EnableMfaSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
