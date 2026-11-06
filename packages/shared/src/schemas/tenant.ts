import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z.string().min(2, 'Company name is required').max(150),
  subdomain: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(63)
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, 'Must be lowercase alphanumeric, optionally with dashes'),
  adminEmail: z.string().email('Valid work email required'),
  adminPassword: z.string().min(12, 'Password must be at least 12 characters'),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
  country: z.string().default('Jamaica'),
  currency: z.string().default('JMD'),
  timezone: z.string().default('America/Jamaica'),
});

export const TenantSettingsSchema = z.object({
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(1),
  workingDays: z.array(z.string()).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  workingHours: z.object({
    start: z.string().default('08:30'),
    end: z.string().default('17:00'),
  }).default({ start: '08:30', end: '17:00' }),
  mfaRequired: z.boolean().default(false),
  sessionTimeoutMinutes: z.number().int().min(5).max(1440).default(60),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type TenantSettings = z.infer<typeof TenantSettingsSchema>;
