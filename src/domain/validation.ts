import { z } from 'zod';
import { bloodGroups } from './types';

export const signInSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});
export const signUpSchema = signInSchema
  .extend({
    name: z.string().trim().min(2, 'Enter your name.').max(80),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
export const requestSchema = z.object({
  bloodGroup: z.enum(bloodGroups),
  unitsRequired: z.number().int().min(1).max(20),
  hospitalId: z.string().min(1, 'Choose a hospital.'),
  urgency: z.enum(['normal', 'urgent', 'critical']),
  requiredBefore: z
    .number()
    .refine(
      (n) => n > Date.now() && n <= Date.now() + 30 * 86_400_000,
      'Choose a time within the next 30 days.',
    ),
  description: z.string().trim().max(600).optional(),
});
export const onboardingSchema = z
  .object({
    role: z.enum(['donor', 'requester']),
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().max(24).optional(),
    city: z.string().trim().min(2).max(80),
    bloodGroup: z.enum(bloodGroups).optional(),
    age: z.number().int().min(18).max(65).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    lastDonationDate: z.number().max(Date.now()).optional(),
    questionnairePassed: z.boolean(),
    shareContact: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.role === 'donor' && (!v.bloodGroup || !v.age))
      ctx.addIssue({
        code: 'custom',
        path: ['bloodGroup'],
        message: 'Donors need a blood group and age.',
      });
  });
