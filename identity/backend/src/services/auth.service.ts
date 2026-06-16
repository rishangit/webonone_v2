import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'
import {
  createPasswordResetToken,
  createRefreshToken,
  createUser,
  findPasswordResetTokenByHash,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  markPasswordResetTokenUsed,
  revokeRefreshToken,
  toUserProfile,
  updateUserPassword,
  updateUserProfile,
  type UpdateUserProfileInput,
  type UserRow,
} from '../models/user.repository.js'
import {
  buildAuthResponse,
  generatePasswordResetToken,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from './token.service.js'
import { env } from '../config/env.js'

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

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

export async function requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
  const user = await findUserByEmail(email)
  if (!user) {
    return {}
  }

  const resetToken = generatePasswordResetToken()
  const tokenHash = hashToken(resetToken)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + env.passwordResetExpiryHours)

  await createPasswordResetToken({
    id: nanoid(),
    userId: user.id,
    tokenHash,
    expiresAt,
  })

  if (process.env.NODE_ENV !== 'production') {
    return { resetToken }
  }
  return {}
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

export { issueAuthTokens }
