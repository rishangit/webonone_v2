import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const registerEmailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export const verifyRegisterOtpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, 'Enter the 4-digit code'),
})

export const registerProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

export const registerPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
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

export type RegisterEmailFormValues = z.infer<typeof registerEmailSchema>
export type VerifyRegisterOtpFormValues = z.infer<typeof verifyRegisterOtpSchema>
export type RegisterProfileFormValues = z.infer<typeof registerProfileSchema>
export type RegisterPasswordFormValues = z.infer<typeof registerPasswordSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type VerifyResetOtpFormValues = z.infer<typeof verifyResetOtpSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type LegacyResetPasswordFormValues = z.infer<typeof legacyResetPasswordSchema>
