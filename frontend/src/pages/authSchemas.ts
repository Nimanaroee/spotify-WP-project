import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

export const listenerRegistrationSchema = z
  .object({
    display_name: z.string().min(2, 'Display name must be at least 2 characters.'),
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    password_confirmation: z.string(),
    birth_date: z.string().min(1, 'Date of birth is required.'),
    gender: z.enum(['male', 'female']),
    privacy_policy_accepted: z
      .boolean()
      .refine((value) => value, 'You must accept the terms and privacy policy.'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords must match.',
    path: ['password_confirmation'],
  })

export const artistRegistrationSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  password_confirmation: z.string(),
  stage_name: z.string().min(2, 'Stage name must be at least 2 characters.'),
  portfolio_links: z.string().trim().min(1, 'Add at least one portfolio link.'),
}).refine((values) => values.password === values.password_confirmation, {
  message: 'Passwords must match.',
  path: ['password_confirmation'],
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ListenerRegistrationFormValues = z.infer<typeof listenerRegistrationSchema>
export type ArtistRegistrationFormValues = z.infer<typeof artistRegistrationSchema>

export function parsePortfolioLinks(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((link) => link.trim())
    .filter(Boolean)
}
