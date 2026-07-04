import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { UserRow } from '../models/user.repository.js'
import { toUserProfile } from '../models/user.repository.js'

export type PlatformRole = 'super_admin' | 'company_admin' | 'member'

export interface AccessTokenPayload {
  sub: string
  email: string
  iss: string
  aud: string
  platform_role?: PlatformRole
  company_id?: string | null
}

export type SessionClaims = {
  platformRole?: PlatformRole
  companyId?: string | null
}

export function signAccessToken(
  user: UserRow,
  sessionClaims?: SessionClaims,
): { accessToken: string; expiresIn: number } {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    iss: env.jwtIssuer,
    aud: env.jwtAudience,
  }
  if (sessionClaims?.platformRole) {
    payload.platform_role = sessionClaims.platformRole
    payload.company_id = sessionClaims.companyId ?? null
  }
  const accessToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.accessTokenExpirySeconds,
  })
  return { accessToken, expiresIn: env.accessTokenExpirySeconds }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/** Four-digit OTP for password reset (1000–9999). */
export function generatePasswordResetOtp(): string {
  return String(crypto.randomInt(1000, 10000))
}

export function generateAuthCode(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function buildAuthResponse(user: UserRow, accessToken: string, expiresIn: number, refreshToken: string) {
  return {
    accessToken,
    refreshToken,
    expiresIn,
    user: toUserProfile(user),
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  }) as AccessTokenPayload
  return decoded
}
