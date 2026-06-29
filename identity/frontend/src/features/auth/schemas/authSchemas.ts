import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export const verifyResetOtpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, 'Enter the 4-digit code'),
})

export const resetPasswordSchema = z.object({
  resetSessionToken: z.string().min(1, 'Reset session is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export const legacyResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type VerifyResetOtpFormValues = z.infer<typeof verifyResetOtpSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type LegacyResetPasswordFormValues = z.infer<typeof legacyResetPasswordSchema>
