import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('errors.emailInvalid'),
  password: z.string().min(1, 'errors.passwordRequired'),
})

export const registerEmailSchema = z.object({
  email: z.string().email('errors.emailInvalid'),
})

export const verifyRegisterOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'errors.otpInvalid'),
})

export const registerProfileSchema = z.object({
  firstName: z.string().min(1, 'errors.firstNameRequired'),
  lastName: z.string().min(1, 'errors.lastNameRequired'),
})

export const registerPasswordSchema = z
  .object({
    password: z.string().min(8, 'errors.passwordMin'),
    confirmPassword: z.string().min(1, 'errors.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'errors.passwordsMismatch',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('errors.emailInvalid'),
})

export const verifyResetOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'errors.otpInvalid'),
})

export const resetPasswordSchema = z.object({
  resetSessionToken: z.string().min(1, 'errors.resetSessionRequired'),
  newPassword: z.string().min(8, 'errors.passwordMin'),
})

export const legacyResetPasswordSchema = z.object({
  token: z.string().min(1, 'errors.resetTokenRequired'),
  newPassword: z.string().min(8, 'errors.passwordMin'),
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
