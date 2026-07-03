import { db, type DataRole, type DataUserRoleRow } from '../models/db.js'

export async function loadUserRole(userId: string): Promise<{ role: DataRole; companyId: string | null }> {
  const row = await db<DataUserRoleRow>('data_user_roles').where({ user_id: userId }).first()
  if (!row) {
    return { role: 'member', companyId: null }
  }
  return { role: row.role, companyId: row.company_id }
}

export async function upsertUserRole(input: {
  userId: string
  role: DataRole
  companyId?: string | null
}) {
  const existing = await db<DataUserRoleRow>('data_user_roles').where({ user_id: input.userId }).first()

  if (existing) {
    await db('data_user_roles').where({ user_id: input.userId }).update({
      role: input.role,
      company_id: input.companyId ?? null,
      updated_at: db.fn.now(3),
    })
  } else {
    await db('data_user_roles').insert({
      user_id: input.userId,
      role: input.role,
      company_id: input.companyId ?? null,
      updated_at: db.fn.now(3),
    })
  }

  return { userId: input.userId, role: input.role, companyId: input.companyId ?? null }
}
