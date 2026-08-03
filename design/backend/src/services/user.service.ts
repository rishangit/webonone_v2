import { db } from '../models/db.js'

function placeholderEmail(userId: string) {
  return `${userId}@users.local`
}

/** Upsert a local profile copy so FKs to `design_users` succeed for JWT subjects. */
export async function ensureLocalUser(input: {
  userId: string
  email?: string | null
  displayName?: string | null
}) {
  const preferredEmail = input.email?.trim() || placeholderEmail(input.userId)
  const displayName = input.displayName?.trim() || ''

  const existing = await db('design_users').where({ id: input.userId }).first()
  if (existing) {
    const updates: {
      email?: string
      display_name?: string
      updated_at: ReturnType<typeof db.fn.now>
    } = {
      updated_at: db.fn.now(3),
    }
    if (input.email?.trim() && input.email.trim() !== existing.email) {
      const emailTaken = await db('design_users')
        .where({ email: input.email.trim() })
        .whereNot({ id: input.userId })
        .first()
      if (!emailTaken) updates.email = input.email.trim()
    }
    if (input.displayName != null && displayName !== existing.display_name) {
      updates.display_name = displayName
    }
    if (updates.email || updates.display_name) {
      await db('design_users').where({ id: input.userId }).update(updates)
    }
    return
  }

  const emailTaken = await db('design_users').where({ email: preferredEmail }).first()
  const email = emailTaken ? placeholderEmail(input.userId) : preferredEmail

  try {
    await db('design_users').insert({
      id: input.userId,
      email,
      display_name: displayName,
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
  } catch (err) {
    const again = await db('design_users').where({ id: input.userId }).first()
    if (again) return
    throw err
  }
}

/** Upsert a local company copy so FKs to `design_companies` succeed for JWT company_id. */
export async function ensureLocalCompany(input: { companyId: string; name?: string | null }) {
  const existing = await db('design_companies').where({ id: input.companyId }).first()
  if (existing) return

  try {
    await db('design_companies').insert({
      id: input.companyId,
      name: input.name?.trim() || input.companyId,
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
  } catch (err) {
    const again = await db('design_companies').where({ id: input.companyId }).first()
    if (again) return
    throw err
  }
}
