import type { Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/validate.js'
import {
  AuthError,
  completeRegistration,
  createAuthCodeForUser,
  exchangeAuthCode,
  getCurrentUser,
  loginUser,
  logoutUser,
  patchCurrentUser,
  refreshAccessToken,
  requestPasswordReset,
  requestRegisterEmailOtp,
  resendEmailVerification,
  resetPassword,
  resetPasswordWithSession,
  reissueSessionRole,
  verifyEmail,
  verifyRegisterEmailOtp,
  verifyResetOtp,
} from '../services/auth.service.js'
import { loginWithGoogle } from '../services/googleAuth.service.js'

const registerEmailOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

const verifyRegisterEmailOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.coerce.string().regex(/^\d{4}$/, 'Enter the 4-digit code'),
})

const completeRegistrationSchema = z.object({
  registrationSessionToken: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const googleSchema = z.object({
  idToken: z.string().min(1),
})

const patchMeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(255).optional(),
  phoneNumber: z
    .string()
    .max(32)
    .nullable()
    .optional()
    .refine((value) => value === undefined || value === null || /^\+\d{7,15}$/.test(value)),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  stateRegion: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  avatarUrl: z.string().max(512).nullable().optional(),
  locale: z.string().max(20).nullable().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z
  .object({
    token: z.string().min(1).optional(),
    resetSessionToken: z.string().min(1).optional(),
    newPassword: z.string().min(8),
  })
  .refine((data) => Boolean(data.token || data.resetSessionToken), {
    message: 'Reset token or session token is required',
  })

const verifyResetOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.coerce.string().regex(/^\d{4}$/, 'Enter the 4-digit code'),
})

const resendVerificationSchema = z.object({
  email: z.string().email(),
})

const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const authCodeSchema = z.object({
  redirectUri: z.string().url(),
})

const exchangeSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
})

function handleAuthError(err: unknown, res: Response): boolean {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      ...err.details,
    })
    return true
  }
  return false
}

export async function requestRegisterEmailOtpHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const body = registerEmailOtpSchema.parse(req.body)
    await requestRegisterEmailOtp(body.email)
    res.json({ message: 'Verification code sent to your email.' })
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function verifyRegisterEmailOtpHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const body = verifyRegisterEmailOtpSchema.parse(req.body)
    const result = await verifyRegisterEmailOtp(body.email, body.otp)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function completeRegistrationHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const body = completeRegistrationSchema.parse(req.body)
    const user = await completeRegistration(body)
    res.status(201).json({ user })
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const body = loginSchema.parse(req.body)
    const result = await loginUser(body.email, body.password)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function googleLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const body = googleSchema.parse(req.body)
    const result = await loginWithGoogle(body.idToken)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function forgotPassword(req: AuthenticatedRequest, res: Response) {
  const body = forgotPasswordSchema.parse(req.body)
  await requestPasswordReset(body.email)
  res.json({ message: 'If the email exists, a verification code has been sent.' })
}

export async function verifyResetOtpHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const body = verifyResetOtpSchema.parse(req.body)
    const result = await verifyResetOtp(body.email, body.otp)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function resetPasswordHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const body = resetPasswordSchema.parse(req.body)
    if (body.resetSessionToken) {
      await resetPasswordWithSession(body.resetSessionToken, body.newPassword)
    } else {
      await resetPassword(body.token!, body.newPassword)
    }
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function resendVerification(req: AuthenticatedRequest, res: Response) {
  try {
    const body = resendVerificationSchema.parse(req.body)
    await resendEmailVerification(body.email)
    res.json({ message: 'Verification email sent' })
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function verifyEmailHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const body = verifyEmailSchema.parse(req.body)
    await verifyEmail(body.token)
    res.json({ message: 'Email verified successfully' })
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function refresh(req: AuthenticatedRequest, res: Response) {
  try {
    const body = refreshSchema.parse(req.body)
    const result = await refreshAccessToken(body.refreshToken)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  const body = refreshSchema.parse(req.body)
  await logoutUser(body.refreshToken)
  res.json({ message: 'Logged out' })
}

export async function createAuthCode(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }
    const body = authCodeSchema.parse(req.body)
    const result = await createAuthCodeForUser(req.user.id, body.redirectUri)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function exchange(req: AuthenticatedRequest, res: Response) {
  try {
    const body = exchangeSchema.parse(req.body)
    const result = await exchangeAuthCode(body.code, body.redirectUri)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }
    const user = await getCurrentUser(req.user.id)
    res.json({ user })
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function patchMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }
    const body = patchMeSchema.parse(req.body)
    const user = await patchCurrentUser(req.user.id, body)
    res.json({ user })
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

const sessionRoleSchema = z.object({
  platformRole: z.enum(['super_admin', 'company_admin', 'member']),
  companyId: z.string().nullable().optional(),
})

export async function sessionRoleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
      return
    }
    const body = sessionRoleSchema.parse(req.body)
    const result = await reissueSessionRole(req.user.id, body.platformRole, body.companyId)
    res.json(result)
  } catch (err) {
    if (handleAuthError(err, res)) return
    throw err
  }
}

export async function health(_req: AuthenticatedRequest, res: Response) {
  res.json({ status: 'ok', service: 'identity' })
}
