import { db } from './user.repository.js'

export interface AuthCodeRow {
  id: string
  user_id: string
  code_hash: string
  redirect_uri: string
  expires_at: Date
  used_at: Date | null
  created_at: Date
}

export async function createAuthCode(input: {
  id: string
  userId: string
  codeHash: string
  redirectUri: string
  expiresAt: Date
}): Promise<void> {
  await db('auth_codes').insert({
    id: input.id,
    user_id: input.userId,
    code_hash: input.codeHash,
    redirect_uri: input.redirectUri,
    expires_at: input.expiresAt,
  })
}

export async function findAuthCodeByHash(codeHash: string): Promise<AuthCodeRow | undefined> {
  return db<AuthCodeRow>('auth_codes').where({ code_hash: codeHash }).first()
}

export async function markAuthCodeUsed(id: string): Promise<void> {
  await db('auth_codes').where({ id }).update({ used_at: db.fn.now(3) })
}
