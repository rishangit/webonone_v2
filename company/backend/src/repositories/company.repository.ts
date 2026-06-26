import { db } from '../models/db.js'

export type CompanyRow = {
  id: string
  name: string
  description: string | null
  company_size: string | null
  logo_url: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state_region: string | null
  postal_code: string | null
  country: string | null
  contact_email: string | null
  contact_phone: string | null
  status: 'pending' | 'approved'
  created_by_user_id: string
  created_at: Date
  updated_at: Date
  approved_at: Date | null
  approved_by_super_admin_id: string | null
}

export type MembershipRow = {
  id: string
  company_id: string
  user_id: string
  role: 'member' | 'company_admin'
  created_at: Date
  updated_at: Date
}

export type SuperAdminRow = {
  id: string
  email: string
  password_hash: string
  display_name: string
  created_at: Date
}

export async function findMembershipByUserId(userId: string): Promise<MembershipRow | undefined> {
  return db<MembershipRow>('company_memberships').where({ user_id: userId }).first()
}

export async function findCompanyById(id: string): Promise<CompanyRow | undefined> {
  return db<CompanyRow>('companies').where({ id }).first()
}

export async function insertCompany(row: Omit<CompanyRow, 'created_at' | 'updated_at' | 'approved_at' | 'approved_by_super_admin_id'>): Promise<void> {
  await db('companies').insert({
    ...row,
    approved_at: null,
    approved_by_super_admin_id: null,
  })
}

export async function insertMembership(row: Omit<MembershipRow, 'created_at' | 'updated_at'>): Promise<void> {
  await db('company_memberships').insert(row)
}

export async function listPendingCompanies(): Promise<CompanyRow[]> {
  return db<CompanyRow>('companies').where({ status: 'pending' }).orderBy('created_at', 'asc')
}

export async function approveCompany(
  companyId: string,
  superAdminId: string,
): Promise<CompanyRow | undefined> {
  const now = db.fn.now(3)
  const updated = await db<CompanyRow>('companies')
    .where({ id: companyId, status: 'pending' })
    .update({
      status: 'approved',
      approved_at: now,
      approved_by_super_admin_id: superAdminId,
      updated_at: now,
    })

  if (!updated) return undefined
  return findCompanyById(companyId)
}

export async function promoteUserToCompanyAdmin(companyId: string, userId: string): Promise<void> {
  await db('company_memberships')
    .where({ company_id: companyId, user_id: userId })
    .update({ role: 'company_admin', updated_at: db.fn.now(3) })
}

export async function findSuperAdminByEmail(email: string): Promise<SuperAdminRow | undefined> {
  return db<SuperAdminRow>('super_admins').where({ email }).first()
}

export async function upsertSuperAdmin(input: {
  id: string
  email: string
  passwordHash: string
  displayName: string
}): Promise<void> {
  const existing = await findSuperAdminByEmail(input.email)
  if (existing) {
    await db('super_admins')
      .where({ id: existing.id })
      .update({
        password_hash: input.passwordHash,
        display_name: input.displayName,
      })
    return
  }

  await db('super_admins').insert({
    id: input.id,
    email: input.email,
    password_hash: input.passwordHash,
    display_name: input.displayName,
  })
}
