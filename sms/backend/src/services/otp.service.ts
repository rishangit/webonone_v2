import crypto from 'crypto'
import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import { db } from '../models/db.js'
import type { SmsOtpRow } from '../models/db.js'
import { enqueue } from './queue.service.js'

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateCode(): string {
  return String(crypto.randomInt(100000, 1000000))
}

/** Generate + store a hashed OTP, then enqueue it for delivery via the `otp` template. */
export async function sendOtp(input: {
  phoneNumber: string
  purpose: string
  companyId?: string | null
}): Promise<{ otpId: string; status: 'queued' }> {
  // Invalidate any previous unused OTPs for this phone/purpose.
  await db('sms_otps')
    .where({ phone_number: input.phoneNumber, purpose: input.purpose })
    .whereNull('used_at')
    .update({ used_at: db.fn.now(3) })

  const code = generateCode()
  const id = nanoid()
  const expiresAt = new Date(Date.now() + env.otpTtlSeconds * 1000)

  await db('sms_otps').insert({
    id,
    phone_number: input.phoneNumber,
    otp_hash: hashOtp(code),
    purpose: input.purpose,
    company_id: input.companyId ?? null,
    expires_at: expiresAt,
    used_at: null,
    attempt_count: 0,
    created_at: db.fn.now(3),
  })

  await enqueue({
    toNumber: input.phoneNumber,
    templateSlug: 'otp',
    payload: { code, minutes: String(Math.round(env.otpTtlSeconds / 60)) },
    companyId: input.companyId ?? null,
    priority: 10,
  })

  return { otpId: id, status: 'queued' }
}

export async function verifyOtp(input: {
  phoneNumber: string
  purpose: string
  code: string
  companyId?: string | null
}): Promise<{ valid: boolean; reason?: string }> {
  const row = await db<SmsOtpRow>('sms_otps')
    .where({ phone_number: input.phoneNumber, purpose: input.purpose })
    .whereNull('used_at')
    .orderBy('created_at', 'desc')
    .first()

  if (!row) return { valid: false, reason: 'NOT_FOUND' }
  if (new Date(row.expires_at).getTime() < Date.now()) return { valid: false, reason: 'EXPIRED' }
  if (row.attempt_count >= env.otpMaxAttempts) return { valid: false, reason: 'TOO_MANY_ATTEMPTS' }

  if (row.otp_hash !== hashOtp(input.code)) {
    await db('sms_otps').where({ id: row.id }).update({ attempt_count: row.attempt_count + 1 })
    return { valid: false, reason: 'INVALID_CODE' }
  }

  await db('sms_otps').where({ id: row.id }).update({ used_at: db.fn.now(3) })
  return { valid: true }
}

/** Reaper: drop expired OTP rows to keep the table small. */
export async function purgeExpiredOtps(): Promise<number> {
  return db('sms_otps').where('expires_at', '<', new Date()).del()
}
