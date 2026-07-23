import { db } from '../models/user.repository.js'
import type { Knex } from 'knex'

export type UserRoleType = 'super_admin' | 'company_admin' | 'member'

export type UserRoleRow = {
  id: string
  user_id: string
  role: UserRoleType
  company_id: string | null
  created_at: Date
  updated_at: Date
}

export async function listRolesByUserId(userId: string): Promise<UserRoleRow[]> {
  return db<UserRoleRow>('users_roles').where({ user_id: userId }).orderBy('created_at', 'asc')
}

export async function findSuperAdminByUserId(userId: string): Promise<UserRoleRow | undefined> {
  return db<UserRoleRow>('users_roles')
    .where({ user_id: userId, role: 'super_admin' })
    .whereNull('company_id')
    .first()
}

export async function findCompanyRolesByUserId(userId: string): Promise<UserRoleRow[]> {
  return db<UserRoleRow>('users_roles')
    .where({ user_id: userId })
    .whereNotNull('company_id')
    .orderBy('created_at', 'asc')
}

export async function findPrimaryCompanyRole(userId: string): Promise<UserRoleRow | undefined> {
  const roles = await findCompanyRolesByUserId(userId)
  if (roles.length === 0) return undefined
  return roles.find((row) => row.role === 'company_admin') ?? roles[0]
}

export async function findCompanyRole(
  userId: string,
  companyId: string,
): Promise<UserRoleRow | undefined> {
  return db<UserRoleRow>('users_roles')
    .where({ user_id: userId, company_id: companyId })
    .orderBy('created_at', 'asc')
    .first()
}

export async function insertUserRole(
  row: Omit<UserRoleRow, 'created_at' | 'updated_at'>,
  trx?: Knex.Transaction,
): Promise<void> {
  const query = trx ?? db
  await query('users_roles').insert(row)
}

export async function upsertSuperAdminRole(userId: string, roleId: string): Promise<void> {
  const existing = await findSuperAdminByUserId(userId)
  if (existing) return

  await db('users_roles').insert({
    id: roleId,
    user_id: userId,
    role: 'super_admin',
    company_id: null,
  })
}

export async function promoteUserToCompanyAdmin(companyId: string, userId: string): Promise<void> {
  const adminRole = await db<UserRoleRow>('users_roles')
    .where({ company_id: companyId, user_id: userId, role: 'company_admin' })
    .first()

  if (adminRole) return

  const memberRole = await db<UserRoleRow>('users_roles')
    .where({ company_id: companyId, user_id: userId, role: 'member' })
    .first()

  if (memberRole) {
    await db('users_roles')
      .where({ id: memberRole.id })
      .update({ role: 'company_admin', updated_at: db.fn.now(3) })
  }
}

export async function demoteUserToMember(companyId: string, userId: string): Promise<void> {
  await db('users_roles')
    .where({ company_id: companyId, user_id: userId, role: 'company_admin' })
    .update({ role: 'member', updated_at: db.fn.now(3) })
}

export async function findCompanyMemberRole(
  userId: string,
  companyId: string,
): Promise<UserRoleRow | undefined> {
  return db<UserRoleRow>('users_roles')
    .where({ user_id: userId, company_id: companyId, role: 'member' })
    .first()
}

export async function findCompanyAdminRole(
  userId: string,
  companyId: string,
): Promise<UserRoleRow | undefined> {
  return db<UserRoleRow>('users_roles')
    .where({ user_id: userId, company_id: companyId, role: 'company_admin' })
    .first()
}
