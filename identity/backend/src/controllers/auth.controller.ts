import type { Response } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/validate.js'
import {
  AuthError,
  getCurrentUser,
  loginUser,
  logoutUser,
  patchCurrentUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from '../services/auth.service.js'
import { loginWithGoogle } from '../services/googleAuth.service.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
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
  phoneNumber: z.string().max(32).nullable().optional(),
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

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

function handleAuthError(err: unknown, res: Response): boolean {
  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ message: err.message, code: err.code })
    return true
  }
  return false
}

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const body = registerSchema.parse(req.body)
    const user = await registerUser(body)
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
  const result = await requestPasswordReset(body.email)
  res.json({ message: 'If the email exists, a reset link has been sent.', ...result })
}

export async function resetPasswordHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const body = resetPasswordSchema.parse(req.body)
    await resetPassword(body.token, body.newPassword)
    res.json({ message: 'Password updated successfully' })
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

export async function health(_req: AuthenticatedRequest, res: Response) {
  res.json({ status: 'ok', service: 'identity' })
}
