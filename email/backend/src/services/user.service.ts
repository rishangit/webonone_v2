import { nanoid } from 'nanoid'
import { db } from '../models/db.js'
import type { EmailRole, EmailUserRoleRow, EmailUserRow } from '../models/db.js'

export async function loadUserRole(userId: string): Promise<{ role: EmailRole; companyId: string | null }> {
  const row = await db<EmailUserRoleRow>('email_user_roles').where({ user_id: userId }).first()
  if (!row) {
    return { role: 'member', companyId: null }
  }
  return { role: row.role, companyId: row.company_id }
}

export async function syncUserRole(input: {
  userId: string
  email?: string
  displayName?: string
  role: EmailRole
  companyId?: string | null
}) {
  if (input.companyId) {
    const existingCompany = await db('email_companies').where({ id: input.companyId }).first()
    if (!existingCompany) {
      await db('email_companies').insert({
        id: input.companyId,
        name: input.displayName?.trim() || input.companyId,
        created_at: db.fn.now(3),
        updated_at: db.fn.now(3),
      })
    }
  }

  const existingUser = await db<EmailUserRow>('email_users').where({ id: input.userId }).first()

  if (!existingUser && input.email) {
    await db('email_users').insert({
      id: input.userId,
      email: input.email,
      display_name: input.displayName ?? '',
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
  } else if (existingUser && (input.email || input.displayName)) {
    await db('email_users')
      .where({ id: input.userId })
      .update({
        ...(input.email ? { email: input.email } : {}),
        ...(input.displayName ? { display_name: input.displayName } : {}),
        updated_at: db.fn.now(3),
      })
  }

  const existingRole = await db<EmailUserRoleRow>('email_user_roles').where({ user_id: input.userId }).first()

  if (existingRole) {
    await db('email_user_roles').where({ user_id: input.userId }).update({
      role: input.role,
      company_id: input.companyId ?? null,
      updated_at: db.fn.now(3),
    })
  } else {
    await db('email_user_roles').insert({
      id: nanoid(),
      user_id: input.userId,
      role: input.role,
      company_id: input.companyId ?? null,
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
  }

  return { userId: input.userId, role: input.role, companyId: input.companyId ?? null }
}
