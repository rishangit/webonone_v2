import knex, { type Knex } from 'knex'
import { env } from '../config/env.js'
import { rewriteOptionalMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'

export const db = knex({
  client: 'mysql2',
  connection: {
    ...env.database,
    // Keep pooled TCP sockets alive so MySQL/OS does not silently drop idle
    // connections and cause intermittent ECONNRESET on the next query.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  },
  // Do not retain idle connections that can go stale between requests.
  pool: { min: 0, max: 10 },
})

export interface UserRow {
  id: string
  email: string | null
  password_hash: string | null
  google_sub: string | null
  display_name: string
  first_name: string
  last_name: string
  is_email_verified: boolean
  is_phone_verified: boolean
  avatar_url: string | null
  locale: string | null
  phone_number: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state_region: string | null
  postal_code: string | null
  country: string | null
  created_at: Date
  updated_at: Date
}

export interface UserProfile {
  id: string
  email: string | null
  displayName: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  avatarUrl: string | null
  locale: string | null
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isGoogleUser: boolean
}

export interface CreateUserInput {
  id: string
  email?: string | null
  passwordHash?: string | null
  googleSub?: string | null
  displayName: string
  firstName: string
  lastName: string
  isEmailVerified?: boolean
  avatarUrl?: string | null
  locale?: string | null
  phoneNumber?: string | null
  /** Admin-provisioned customer with no password yet (invite set-password). */
  passwordless?: boolean
}

export interface UpdateUserProfileInput {
  firstName?: string
  lastName?: string
  displayName?: string
  phoneNumber?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  stateRegion?: string | null
  postalCode?: string | null
  country?: string | null
  avatarUrl?: string | null
  locale?: string | null
}

function buildDisplayName(firstName: string, lastName: string, storedDisplayName?: string): string {
  const derived = `${firstName} ${lastName}`.trim()
  return storedDisplayName?.trim() || derived || firstName
}

export function toUserProfile(user: UserRow): UserProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: buildDisplayName(user.first_name, user.last_name, user.display_name),
    firstName: user.first_name,
    lastName: user.last_name,
    phoneNumber: user.phone_number,
    addressLine1: user.address_line_1,
    addressLine2: user.address_line_2,
    city: user.city,
    stateRegion: user.state_region,
    postalCode: user.postal_code,
    country: user.country,
    avatarUrl: rewriteOptionalMediaFileUrl(user.avatar_url),
    locale: user.locale,
    isEmailVerified: Boolean(user.is_email_verified),
    isPhoneVerified: Boolean(user.is_phone_verified),
    isGoogleUser: Boolean(user.google_sub),
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ email: email.toLowerCase() }).first()
}

export async function findUserByPhoneNumber(phoneNumber: string): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ phone_number: phoneNumber }).first()
}

export async function findUserById(id: string): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ id }).first()
}

export async function findUserByGoogleSub(googleSub: string): Promise<UserRow | undefined> {
  return db<UserRow>('users').where({ google_sub: googleSub }).first()
}

export async function createUser(
  input: CreateUserInput,
  trx?: Knex.Transaction,
): Promise<UserRow> {
  if (!input.passwordHash && !input.googleSub && !input.passwordless) {
    throw new Error('User must have password_hash, google_sub, or passwordless provision')
  }

  const now = new Date()
  const displayName =
    input.displayName.trim() || `${input.firstName} ${input.lastName}`.trim() || input.firstName
  const email =
    typeof input.email === 'string' && input.email.trim()
      ? input.email.trim().toLowerCase()
      : null

  const query = trx ?? db
  await query('users').insert({
    id: input.id,
    email,
    password_hash: input.passwordHash ?? null,
    google_sub: input.googleSub ?? null,
    display_name: displayName,
    first_name: input.firstName,
    last_name: input.lastName,
    is_email_verified: input.isEmailVerified ?? false,
    avatar_url: input.avatarUrl ?? null,
    locale: input.locale ?? null,
    phone_number: input.phoneNumber ?? null,
    created_at: now,
    updated_at: now,
  })

  const user = await query<UserRow>('users').where({ id: input.id }).first()
  if (!user) throw new Error('Failed to create user')
  return user
}

export interface SyncGoogleProfileInput {
  firstName?: string
  lastName?: string
  displayName?: string
  avatarUrl?: string | null
  locale?: string | null
  isEmailVerified?: boolean
}

export async function syncGoogleProfile(
  userId: string,
  input: SyncGoogleProfileInput,
): Promise<UserRow> {
  const updates: Record<string, unknown> = {
    updated_at: new Date(),
  }

  if (input.firstName) updates.first_name = input.firstName
  if (input.lastName !== undefined) updates.last_name = input.lastName
  if (input.displayName) updates.display_name = input.displayName
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl
  if (input.locale !== undefined) updates.locale = input.locale
  if (input.isEmailVerified !== undefined) updates.is_email_verified = input.isEmailVerified

  await db('users').where({ id: userId }).update(updates)
  const user = await findUserById(userId)
  if (!user) throw new Error('User not found')
  return user
}

export async function linkGoogleAccount(
  userId: string,
  input: {
    googleSub: string
    firstName?: string
    lastName?: string
    displayName?: string
    avatarUrl?: string | null
    locale?: string | null
    isEmailVerified?: boolean
  },
): Promise<UserRow> {
  const updates: Record<string, unknown> = {
    google_sub: input.googleSub,
    updated_at: new Date(),
  }

  if (input.firstName) updates.first_name = input.firstName
  if (input.lastName !== undefined) updates.last_name = input.lastName
  if (input.displayName) updates.display_name = input.displayName
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl
  if (input.locale !== undefined) updates.locale = input.locale
  if (input.isEmailVerified !== undefined) updates.is_email_verified = input.isEmailVerified

  await db('users').where({ id: userId }).update(updates)
  const user = await findUserById(userId)
  if (!user) throw new Error('User not found')
  return user
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserRow> {
  const existing = await findUserById(userId)
  if (!existing) throw new Error('User not found')

  const firstName = input.firstName ?? existing.first_name
  const lastName = input.lastName ?? existing.last_name
  const displayName =
    input.displayName ?? (`${firstName} ${lastName}`.trim() || existing.display_name)

  const updates: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    updated_at: new Date(),
  }

  if (input.phoneNumber !== undefined) {
    updates.phone_number = input.phoneNumber
    const nextPhone = input.phoneNumber ?? null
    const prevPhone = existing.phone_number ?? null
    if (nextPhone !== prevPhone) {
      updates.is_phone_verified = false
    }
  }
  if (input.addressLine1 !== undefined) updates.address_line_1 = input.addressLine1
  if (input.addressLine2 !== undefined) updates.address_line_2 = input.addressLine2
  if (input.city !== undefined) updates.city = input.city
  if (input.stateRegion !== undefined) updates.state_region = input.stateRegion
  if (input.postalCode !== undefined) updates.postal_code = input.postalCode
  if (input.country !== undefined) updates.country = input.country
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl
  if (input.locale !== undefined) updates.locale = input.locale

  await db('users').where({ id: userId }).update(updates)
  const user = await findUserById(userId)
  if (!user) throw new Error('User not found')
  return user
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await db('users').where({ id: userId }).update({
    password_hash: passwordHash,
    updated_at: new Date(),
  })
}

export async function createRefreshToken(input: {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
}): Promise<void> {
  await db('refresh_tokens').insert({
    id: input.id,
    user_id: input.userId,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt,
    created_at: new Date(),
  })
}

export async function findRefreshTokenByHash(tokenHash: string) {
  return db('refresh_tokens').where({ token_hash: tokenHash }).whereNull('revoked_at').first()
}

export async function revokeRefreshToken(id: string): Promise<void> {
  await db('refresh_tokens').where({ id }).update({ revoked_at: new Date() })
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await db('refresh_tokens')
    .where({ user_id: userId })
    .whereNull('revoked_at')
    .update({ revoked_at: new Date() })
}

export async function createPasswordResetToken(input: {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
}): Promise<void> {
  await db('password_reset_tokens').insert({
    id: input.id,
    user_id: input.userId,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt,
    created_at: new Date(),
  })
}

export async function invalidateUnusedPasswordResetTokens(userId: string): Promise<void> {
  await db('password_reset_tokens').where({ user_id: userId }).whereNull('used_at').del()
}

export async function findPasswordResetTokenByHash(tokenHash: string) {
  return db('password_reset_tokens').where({ token_hash: tokenHash }).whereNull('used_at').first()
}

export async function markPasswordResetTokenUsed(id: string): Promise<void> {
  await db('password_reset_tokens').where({ id }).update({ used_at: new Date() })
}

export interface PasswordResetOtpRow {
  id: string
  user_id: string
  otp_hash: string
  expires_at: Date
  used_at: Date | null
  attempt_count: number
  created_at: Date
}

export async function invalidateUnusedPasswordResetOtps(userId: string): Promise<void> {
  await db('password_reset_otps').where({ user_id: userId }).whereNull('used_at').del()
}

export async function createPasswordResetOtp(input: {
  id: string
  userId: string
  otpHash: string
  expiresAt: Date
}): Promise<void> {
  await db('password_reset_otps').insert({
    id: input.id,
    user_id: input.userId,
    otp_hash: input.otpHash,
    expires_at: input.expiresAt,
    attempt_count: 0,
    created_at: new Date(),
  })
}

export async function findActivePasswordResetOtp(userId: string): Promise<PasswordResetOtpRow | undefined> {
  return db<PasswordResetOtpRow>('password_reset_otps')
    .where({ user_id: userId })
    .whereNull('used_at')
    .orderBy('created_at', 'desc')
    .first()
}

export async function updatePasswordResetOtpAttemptCount(id: string, attemptCount: number): Promise<void> {
  await db('password_reset_otps').where({ id }).update({ attempt_count: attemptCount })
}

export async function markPasswordResetOtpUsed(id: string): Promise<void> {
  await db('password_reset_otps').where({ id }).update({ used_at: new Date() })
}

export async function createPasswordResetSession(input: {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
}): Promise<void> {
  await db('password_reset_sessions').insert({
    id: input.id,
    user_id: input.userId,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt,
    created_at: new Date(),
  })
}

export async function findPasswordResetSessionByHash(
  tokenHash: string,
): Promise<{ id: string; user_id: string; expires_at: Date; used_at: Date | null } | undefined> {
  return db('password_reset_sessions')
    .where({ token_hash: tokenHash })
    .whereNull('used_at')
    .first()
}

export async function markPasswordResetSessionUsed(id: string): Promise<void> {
  await db('password_reset_sessions').where({ id }).update({ used_at: new Date() })
}

export async function invalidateUnusedPasswordResetSessions(userId: string): Promise<void> {
  await db('password_reset_sessions').where({ user_id: userId }).whereNull('used_at').del()
}

export interface RegistrationEmailOtpRow {
  id: string
  email: string
  otp_hash: string
  expires_at: Date
  used_at: Date | null
  attempt_count: number
  created_at: Date
}

export async function invalidateUnusedRegistrationEmailOtps(email: string): Promise<void> {
  await db('registration_email_otps').where({ email }).whereNull('used_at').del()
}

export async function createRegistrationEmailOtp(input: {
  id: string
  email: string
  otpHash: string
  expiresAt: Date
}): Promise<void> {
  await db('registration_email_otps').insert({
    id: input.id,
    email: input.email,
    otp_hash: input.otpHash,
    expires_at: input.expiresAt,
    attempt_count: 0,
    created_at: new Date(),
  })
}

export async function findActiveRegistrationEmailOtp(
  email: string,
): Promise<RegistrationEmailOtpRow | undefined> {
  return db<RegistrationEmailOtpRow>('registration_email_otps')
    .where({ email })
    .whereNull('used_at')
    .orderBy('created_at', 'desc')
    .first()
}

export async function updateRegistrationEmailOtpAttemptCount(
  id: string,
  attemptCount: number,
): Promise<void> {
  await db('registration_email_otps').where({ id }).update({ attempt_count: attemptCount })
}

export async function markRegistrationEmailOtpUsed(id: string): Promise<void> {
  await db('registration_email_otps').where({ id }).update({ used_at: new Date() })
}

export async function invalidateUnusedRegistrationSessions(email: string): Promise<void> {
  await db('registration_sessions').where({ email }).whereNull('used_at').del()
}

export async function createRegistrationSession(input: {
  id: string
  email: string
  tokenHash: string
  expiresAt: Date
}): Promise<void> {
  await db('registration_sessions').insert({
    id: input.id,
    email: input.email,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt,
    created_at: new Date(),
  })
}

export async function findRegistrationSessionByHash(
  tokenHash: string,
): Promise<{ id: string; email: string; expires_at: Date; used_at: Date | null } | undefined> {
  return db('registration_sessions')
    .where({ token_hash: tokenHash })
    .whereNull('used_at')
    .first()
}

export async function markRegistrationSessionUsed(id: string): Promise<void> {
  await db('registration_sessions').where({ id }).update({ used_at: new Date() })
}

export async function invalidateRegistrationDataForEmail(email: string): Promise<void> {
  await invalidateUnusedRegistrationEmailOtps(email)
  await invalidateUnusedRegistrationSessions(email)
}

export async function createEmailVerificationToken(input: {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
}): Promise<void> {
  await db('email_verification_tokens').insert({
    id: input.id,
    user_id: input.userId,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt,
    created_at: new Date(),
  })
}

export async function invalidateUnusedEmailVerificationTokens(userId: string): Promise<void> {
  await db('email_verification_tokens').where({ user_id: userId }).whereNull('used_at').del()
}

export async function findEmailVerificationTokenByHash(tokenHash: string) {
  return db('email_verification_tokens').where({ token_hash: tokenHash }).whereNull('used_at').first()
}

export async function markEmailVerificationTokenUsed(id: string): Promise<void> {
  await db('email_verification_tokens').where({ id }).update({ used_at: new Date() })
}

export async function markUserEmailVerified(userId: string): Promise<void> {
  await db('users').where({ id: userId }).update({
    is_email_verified: true,
    updated_at: new Date(),
  })
}

export async function markUserPhoneVerified(userId: string): Promise<void> {
  await db('users').where({ id: userId }).update({
    is_phone_verified: true,
    updated_at: new Date(),
  })
}

export interface ProfileEmailOtpRow {
  id: string
  user_id: string
  email: string
  otp_hash: string
  expires_at: Date
  used_at: Date | null
  attempt_count: number
  created_at: Date
}

export async function invalidateUnusedProfileEmailOtps(userId: string): Promise<void> {
  await db('profile_email_otps').where({ user_id: userId }).whereNull('used_at').del()
}

export async function createProfileEmailOtp(input: {
  id: string
  userId: string
  email: string
  otpHash: string
  expiresAt: Date
}): Promise<void> {
  await db('profile_email_otps').insert({
    id: input.id,
    user_id: input.userId,
    email: input.email,
    otp_hash: input.otpHash,
    expires_at: input.expiresAt,
    attempt_count: 0,
    created_at: new Date(),
  })
}

export async function findActiveProfileEmailOtp(
  userId: string,
): Promise<ProfileEmailOtpRow | undefined> {
  return db<ProfileEmailOtpRow>('profile_email_otps')
    .where({ user_id: userId })
    .whereNull('used_at')
    .orderBy('created_at', 'desc')
    .first()
}

export async function updateProfileEmailOtpAttemptCount(
  id: string,
  attemptCount: number,
): Promise<void> {
  await db('profile_email_otps').where({ id }).update({ attempt_count: attemptCount })
}

export async function markProfileEmailOtpUsed(id: string): Promise<void> {
  await db('profile_email_otps').where({ id }).update({ used_at: new Date() })
}
