import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'
import {
  createPasswordResetOtp,
  createPasswordResetSession,
  createRefreshToken,
  createUser,
  createEmailVerificationToken,
  findActivePasswordResetOtp,
  findPasswordResetSessionByHash,
  findPasswordResetTokenByHash,
  findEmailVerificationTokenByHash,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  invalidateUnusedEmailVerificationTokens,
  invalidateUnusedPasswordResetOtps,
  invalidateUnusedPasswordResetSessions,
  invalidateUnusedPasswordResetTokens,
  markEmailVerificationTokenUsed,
  markPasswordResetOtpUsed,
  markPasswordResetSessionUsed,
  markPasswordResetTokenUsed,
  markUserEmailVerified,
  revokeRefreshToken,
  toUserProfile,
  updatePasswordResetOtpAttemptCount,
  updateUserPassword,
  updateUserProfile,
  type UpdateUserProfileInput,
  type UserRow,
} from '../models/user.repository.js'
import {
  createAuthCode as insertAuthCode,
  findAuthCodeByHash,
  markAuthCodeUsed,
} from '../models/authCode.repository.js'
import {
  buildAuthResponse,
  generateAuthCode,
  generatePasswordResetOtp,
  generatePasswordResetToken,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from './token.service.js'
import { matchesRedirectUri } from '@webonone/platform-nav'
import { env } from '../config/env.js'
import { sendTransactionalEmail } from './emailClient.service.js'

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

const OTP_MAX_ATTEMPTS = 3
const OTP_EXPIRY_MS = 60 * 1000
const RESET_SESSION_EXPIRY_MS = 10 * 60 * 1000

async function issueAuthTokens(user: UserRow) {
  const { accessToken, expiresIn } = signAccessToken(user)
  const refreshToken = generateRefreshToken()
  const refreshTokenHash = hashToken(refreshToken)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + env.refreshTokenExpiryDays)

  await createRefreshToken({
    id: nanoid(),
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt,
  })

  return buildAuthResponse(user, accessToken, expiresIn, refreshToken)
}

async function issueEmailVerification(user: UserRow): Promise<void> {
  await invalidateUnusedEmailVerificationTokens(user.id)

  const verificationToken = generatePasswordResetToken()
  const tokenHash = hashToken(verificationToken)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + env.emailVerificationExpiryHours)

  await createEmailVerificationToken({
    id: nanoid(),
    userId: user.id,
    tokenHash,
    expiresAt,
  })

  await sendTransactionalEmail({
    templateSlug: 'email_verification',
    toEmail: user.email,
    payload: {
      userName: user.display_name,
      actionUrl: `${env.identityFrontendOrigin}/verify-email?token=${verificationToken}`,
    },
    requestedByService: 'identity',
  })
}

export async function registerUser(input: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  const existing = await findUserByEmail(input.email)
  if (existing) {
    throw new AuthError('Email already registered', 409, 'EMAIL_EXISTS')
  }

  const passwordHash = await bcrypt.hash(input.password, 12)
  const displayName = `${input.firstName} ${input.lastName}`.trim()
  const user = await createUser({
    id: nanoid(),
    email: input.email,
    passwordHash,
    displayName,
    firstName: input.firstName,
    lastName: input.lastName,
  })

  void issueEmailVerification(user).catch((err) => {
    console.error('[auth] failed to send verification email:', err)
  })

  return toUserProfile(user)
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email)
  if (!user || !user.password_hash) {
    throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  return issueAuthTokens(user)
}

export async function refreshAccessToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken)
  const stored = await findRefreshTokenByHash(tokenHash)
  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw new AuthError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN')
  }

  const user = await findUserById(stored.user_id)
  if (!user) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND')
  }

  const { accessToken, expiresIn } = signAccessToken(user)
  return { accessToken, expiresIn, user: toUserProfile(user) }
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken)
  const stored = await findRefreshTokenByHash(tokenHash)
  if (stored) {
    await revokeRefreshToken(stored.id)
  }
}

export async function requestPasswordReset(_email: string): Promise<void> {
  const user = await findUserByEmail(_email)
  if (!user) {
    return
  }

  await invalidateUnusedPasswordResetOtps(user.id)
  await invalidateUnusedPasswordResetTokens(user.id)

  const otp = generatePasswordResetOtp()
  const otpHash = hashToken(otp)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

  await createPasswordResetOtp({
    id: nanoid(),
    userId: user.id,
    otpHash,
    expiresAt,
  })

  void sendTransactionalEmail({
    templateSlug: 'password_reset_otp',
    toEmail: user.email,
    payload: {
      userName: user.display_name ?? user.email,
      otp,
    },
    requestedByService: 'identity',
  }).catch((err) => {
    console.error('[auth] failed to send password reset OTP email:', err)
  })
}

export async function verifyResetOtp(
  email: string,
  otp: string,
): Promise<{ resetSessionToken: string; expiresAt: string }> {
  const user = await findUserByEmail(email)
  if (!user) {
    throw new AuthError('Invalid verification code', 401, 'INVALID_OTP', { attemptsRemaining: 0 })
  }

  const record = await findActivePasswordResetOtp(user.id)
  if (!record) {
    throw new AuthError('Invalid verification code', 401, 'INVALID_OTP', { attemptsRemaining: 0 })
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new AuthError('Verification code expired', 401, 'OTP_EXPIRED')
  }

  if (record.attempt_count >= OTP_MAX_ATTEMPTS) {
    throw new AuthError('Too many incorrect attempts', 403, 'OTP_MAX_ATTEMPTS')
  }

  const otpHash = hashToken(otp)
  if (otpHash !== record.otp_hash) {
    const nextAttempts = record.attempt_count + 1
    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      await markPasswordResetOtpUsed(record.id)
      throw new AuthError('Too many incorrect attempts', 403, 'OTP_MAX_ATTEMPTS')
    }
    await updatePasswordResetOtpAttemptCount(record.id, nextAttempts)
    throw new AuthError('Invalid verification code', 401, 'INVALID_OTP', {
      attemptsRemaining: OTP_MAX_ATTEMPTS - nextAttempts,
    })
  }

  await markPasswordResetOtpUsed(record.id)
  await invalidateUnusedPasswordResetSessions(user.id)

  const resetSessionToken = generatePasswordResetToken()
  const sessionExpiresAt = new Date(Date.now() + RESET_SESSION_EXPIRY_MS)

  await createPasswordResetSession({
    id: nanoid(),
    userId: user.id,
    tokenHash: hashToken(resetSessionToken),
    expiresAt: sessionExpiresAt,
  })

  return {
    resetSessionToken,
    expiresAt: sessionExpiresAt.toISOString(),
  }
}

export async function resendEmailVerification(email: string): Promise<void> {
  const user = await findUserByEmail(email)
  if (!user) {
    throw new AuthError('Email not found', 404, 'EMAIL_NOT_FOUND')
  }
  if (user.is_email_verified) {
    throw new AuthError('Email already verified', 400, 'ALREADY_VERIFIED')
  }

  await issueEmailVerification(user)
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token)
  const stored = await findEmailVerificationTokenByHash(tokenHash)
  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw new AuthError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN')
  }

  await markUserEmailVerified(stored.user_id)
  await markEmailVerificationTokenUsed(stored.id)
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token)
  const stored = await findPasswordResetTokenByHash(tokenHash)
  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw new AuthError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await updateUserPassword(stored.user_id, passwordHash)
  await markPasswordResetTokenUsed(stored.id)
}

export async function resetPasswordWithSession(resetSessionToken: string, newPassword: string) {
  const tokenHash = hashToken(resetSessionToken)
  const stored = await findPasswordResetSessionByHash(tokenHash)
  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw new AuthError('Invalid or expired reset session', 400, 'INVALID_RESET_SESSION')
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await updateUserPassword(stored.user_id, passwordHash)
  await markPasswordResetSessionUsed(stored.id)
  await invalidateUnusedPasswordResetOtps(stored.user_id)
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId)
  if (!user) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND')
  }
  return toUserProfile(user)
}

export async function patchCurrentUser(userId: string, input: UpdateUserProfileInput) {
  const user = await updateUserProfile(userId, input)
  return toUserProfile(user)
}

const AUTH_CODE_EXPIRY_SECONDS = 60

function isAllowedRedirectUri(redirectUri: string): boolean {
  return matchesRedirectUri(redirectUri, env.allowedRedirectUris)
}

export async function createAuthCodeForUser(userId: string, redirectUri: string): Promise<{ code: string }> {
  if (!isAllowedRedirectUri(redirectUri)) {
    throw new AuthError('Invalid redirect URI', 400, 'INVALID_REDIRECT_URI')
  }

  const user = await findUserById(userId)
  if (!user) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND')
  }

  const code = generateAuthCode()
  const codeHash = hashToken(code)
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + AUTH_CODE_EXPIRY_SECONDS)

  await insertAuthCode({
    id: nanoid(),
    userId,
    codeHash,
    redirectUri,
    expiresAt,
  })

  return { code }
}

export async function exchangeAuthCode(code: string, redirectUri: string) {
  if (!isAllowedRedirectUri(redirectUri)) {
    throw new AuthError('Invalid redirect URI', 400, 'INVALID_REDIRECT_URI')
  }

  const codeHash = hashToken(code)
  const stored = await findAuthCodeByHash(codeHash)
  if (!stored || stored.used_at || new Date(stored.expires_at) < new Date()) {
    throw new AuthError('Invalid or expired authorization code', 400, 'INVALID_AUTH_CODE')
  }

  if (stored.redirect_uri !== redirectUri) {
    throw new AuthError('Redirect URI mismatch', 400, 'REDIRECT_URI_MISMATCH')
  }

  const user = await findUserById(stored.user_id)
  if (!user) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND')
  }

  await markAuthCodeUsed(stored.id)

  const { accessToken, expiresIn } = signAccessToken(user)
  return {
    accessToken,
    expiresIn,
    user: toUserProfile(user),
  }
}

export { issueAuthTokens }
