import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { env } from '../config/env.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function resolveKey(): Buffer {
  const raw = env.aiCredentialsEncryptionKey
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex')
  }
  const fromBase64 = Buffer.from(raw, 'base64')
  if (fromBase64.length === 32) {
    return fromBase64
  }
  throw new Error('AI_CREDENTIALS_ENCRYPTION_KEY must be 32-byte hex (64 chars) or base64')
}

/** Encrypt a secret for DB storage. Format: base64(iv).base64(ciphertext).base64(tag) */
export function encryptCredential(plaintext: string): string {
  const key = resolveKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${encrypted.toString('base64')}.${tag.toString('base64')}`
}

/** Decrypt a value produced by encryptCredential. */
export function decryptCredential(payload: string): string {
  const parts = payload.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted credential format')
  }
  const [ivB64, dataB64, tagB64] = parts
  const key = resolveKey()
  const iv = Buffer.from(ivB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted credential lengths')
  }
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
