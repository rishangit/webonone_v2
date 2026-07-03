import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import type { RegisterCompanyBody, UpdateCompanyStatusBody } from '../schemas/companySchemas.js'
import * as repo from '../repositories/company.repository.js'
import * as roleRepo from '../repositories/userRole.repository.js'
import { sendTransactionalEmail, syncUserRole } from './emailClient.service.js'
import { syncDataUserRole } from './dataClient.service.js'

export type CompanyWithMembership = {
  company: {
    id: string
    name: string
    logoUrl: string | null
    status: repo.CompanyStatus
    createdAt: string
    approvedAt: string | null
  }
  membership: {
    role: 'member' | 'company_admin'
  }
}

export type AdminCompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  status: repo.CompanyStatus
  createdByUserId: string
  createdAt: string
  approvedAt: string | null
}

function toCompanyWithMembership(
  company: repo.CompanyRow,
  role: roleRepo.UserRoleRow,
): CompanyWithMembership {
  const membershipRole = role.role === 'company_admin' ? 'company_admin' : 'member'
  return {
    company: {
      id: company.id,
      name: company.name,
      logoUrl: company.logo_url,
      status: company.status,
      createdAt: company.created_at.toISOString(),
      approvedAt: company.approved_at ? company.approved_at.toISOString() : null,
    },
    membership: {
      role: membershipRole,
    },
  }
}

function toAdminCompanySummary(row: repo.CompanyRow): AdminCompanySummary {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at.toISOString(),
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
  }
}

export async function getMyCompany(userId: string): Promise<CompanyWithMembership | null> {
  const role = await roleRepo.findPrimaryCompanyRole(userId)
  if (!role?.company_id) return null

  const company = await repo.findCompanyById(role.company_id)
  if (!company) return null

  return toCompanyWithMembership(company, role)
}

export async function registerCompany(
  userId: string,
  input: RegisterCompanyBody,
): Promise<CompanyWithMembership> {
  const companyId = nanoid()
  const roleId = nanoid()

  await repo.insertCompany({
    id: companyId,
    name: input.name,
    description: input.description,
    company_size: input.companySize,
    logo_url: input.logoUrl ?? null,
    address_line1: input.addressLine1,
    address_line2: input.addressLine2?.trim() || null,
    city: input.city,
    state_region: input.stateRegion?.trim() || null,
    postal_code: input.postalCode?.trim() || null,
    country: input.country,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    status: 'pending',
    created_by_user_id: userId,
  })

  await roleRepo.insertUserRole({
    id: roleId,
    user_id: userId,
    role: 'company_admin',
    company_id: companyId,
  })

  const company = await repo.findCompanyById(companyId)
  const role = await roleRepo.findCompanyRole(userId, companyId)
  if (!company || !role) {
    throw new Error('Failed to create company')
  }

  sendCompanyEmail('company_registered', company)
  syncCompanyMemberRole(userId, 'company_admin', company)

  return toCompanyWithMembership(company, role)
}

function sendCompanyEmail(
  templateSlug: 'company_registered' | 'company_approved' | 'company_rejected',
  company: repo.CompanyRow,
  extraPayload: Record<string, string> = {},
): void {
  const toEmail = company.contact_email
  if (!toEmail) return

  void sendTransactionalEmail({
    templateSlug,
    toEmail,
    payload: {
      companyName: company.name,
      userName: toEmail,
      ...extraPayload,
    },
    companyId: company.id,
    requestedByService: 'webonone',
  }).catch((err) => {
    console.error(`[company] failed to send ${templateSlug} email:`, err)
  })
}

function syncCompanyMemberRole(
  userId: string,
  role: 'member' | 'company_admin',
  company: repo.CompanyRow,
): void {
  void syncUserRole({
    userId,
    role,
    companyId: company.id,
    email: company.contact_email ?? undefined,
    displayName: company.name,
  }).catch((err) => {
    console.error('[company] failed to sync user role to email service:', err)
  })
}

export async function getSuperAdminProfile(userId: string, email: string) {
  const role = await roleRepo.findSuperAdminByUserId(userId)
  if (!role) return null
  return {
    id: userId,
    email,
    displayName: env.superAdminDisplayName,
  }
}

export async function listAllCompanies(): Promise<AdminCompanySummary[]> {
  const rows = await repo.listAllCompanies()
  return rows.map(toAdminCompanySummary)
}

export async function listPendingCompanies() {
  const rows = await repo.listPendingCompanies()
  return rows.map(toAdminCompanySummary)
}

export async function approveCompany(companyId: string, superAdminUserId: string) {
  return updateCompanyStatus(companyId, { status: 'approved' }, superAdminUserId)
}

export async function updateCompanyStatus(
  companyId: string,
  input: UpdateCompanyStatusBody,
  superAdminUserId: string,
) {
  const existing = await repo.findCompanyById(companyId)
  if (!existing) {
    const err = new Error('Company not found')
    ;(err as Error & { statusCode: number }).statusCode = 404
    throw err
  }

  const company = await repo.updateCompanyStatus(
    companyId,
    input.status,
    input.status === 'approved' ? superAdminUserId : null,
  )
  if (!company) {
    const err = new Error('Company not found')
    ;(err as Error & { statusCode: number }).statusCode = 404
    throw err
  }

  if (input.status === 'approved') {
    await roleRepo.promoteUserToCompanyAdmin(company.id, company.created_by_user_id)
  } else {
    await roleRepo.demoteUserToMember(company.id, company.created_by_user_id)
  }

  const role = await roleRepo.findCompanyRole(company.created_by_user_id, company.id)
  if (!role) {
    throw new Error('User role not found after status update')
  }

  if (input.status === 'approved') {
    sendCompanyEmail('company_approved', company)
    syncCompanyMemberRole(company.created_by_user_id, 'company_admin', company)
  } else if (input.status === 'rejected') {
    sendCompanyEmail('company_rejected', company)
    syncCompanyMemberRole(company.created_by_user_id, 'member', company)
  }

  return toCompanyWithMembership(company, role)
}

export async function seedSuperAdminFromEnv(): Promise<void> {
  if (!env.superAdminUserId) {
    console.warn('[seed] SUPER_ADMIN_USER_ID not set — skipping super_admin role seed')
    return
  }

  await roleRepo.upsertSuperAdminRole(env.superAdminUserId, nanoid())
}

export type SyncedEmailRole = {
  role: 'super_admin' | 'company_admin' | 'member'
  companyId: string | null
}

export type AssumableRoleOption = {
  role: 'super_admin' | 'company_admin' | 'member'
  companyId: string | null
  label: string
  companyName?: string
}

export type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  hasCompanyMembership: boolean
}

export async function getAssumableRoles(userId: string): Promise<AssumableRolesResponse> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  const primaryRole = await roleRepo.findPrimaryCompanyRole(userId)

  if (!primaryRole?.company_id) {
    if (superAdmin) {
      return {
        roles: [{ role: 'super_admin', companyId: null, label: 'Super Admin' }],
        hasCompanyMembership: false,
      }
    }
    return {
      roles: [{ role: 'member', companyId: null, label: 'Default User' }],
      hasCompanyMembership: false,
    }
  }

  const company = await repo.findCompanyById(primaryRole.company_id)
  const companyName = company?.name
  const companyId = primaryRole.company_id
  const roles: AssumableRoleOption[] = []

  if (superAdmin) {
    roles.push({ role: 'super_admin', companyId: null, label: 'Super Admin' })
  }

  const companyRoles = await roleRepo.findCompanyRolesByUserId(userId)
  const hasCompanyAdmin = companyRoles.some(
    (row) => row.company_id === companyId && row.role === 'company_admin',
  )
  if (hasCompanyAdmin) {
    roles.push({
      role: 'company_admin',
      companyId,
      label: 'Company Admin',
      companyName,
    })
  }

  roles.push({
    role: 'member',
    companyId,
    label: 'Default User',
    companyName,
  })

  return { roles, hasCompanyMembership: true }
}

async function assertCanAssumeSessionRole(
  userId: string,
  sessionRole: 'super_admin' | 'company_admin' | 'member',
  companyId?: string | null,
): Promise<void> {
  const assumable = await getAssumableRoles(userId)
  const match = assumable.roles.find(
    (option) =>
      option.role === sessionRole &&
      (sessionRole === 'super_admin' || option.companyId === (companyId ?? option.companyId)),
  )
  if (!match) {
    const err = new Error('Invalid session role for this user') as Error & { statusCode?: number }
    err.statusCode = 403
    throw err
  }
}

async function syncEmailRoleAs(
  userId: string,
  email: string,
  role: 'super_admin' | 'company_admin' | 'member',
  companyId: string | null,
): Promise<SyncedEmailRole> {
  if (role === 'super_admin') {
    await syncUserRole({
      userId,
      role: 'super_admin',
      email,
      displayName: env.superAdminDisplayName,
    })
    return { role: 'super_admin', companyId: null }
  }

  if (role === 'company_admin' && companyId) {
    const company = await repo.findCompanyById(companyId)
    await syncUserRole({
      userId,
      role: 'company_admin',
      companyId,
      email,
      displayName: company?.name ?? email,
    })
    return { role: 'company_admin', companyId }
  }

  await syncUserRole({
    userId,
    role: 'member',
    companyId: companyId ?? undefined,
    email,
  })
  return { role: 'member', companyId }
}

export async function syncEmailRoleForUser(
  userId: string,
  email: string,
  sessionRole?: 'super_admin' | 'company_admin' | 'member',
  companyId?: string | null,
): Promise<SyncedEmailRole> {
  if (sessionRole) {
    await assertCanAssumeSessionRole(userId, sessionRole, companyId)
    const effectiveCompanyId =
      sessionRole === 'super_admin' ? null : (companyId ?? (await getMyCompany(userId))?.company.id ?? null)
    return syncEmailRoleAs(userId, email, sessionRole, effectiveCompanyId)
  }

  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) {
    return syncEmailRoleAs(userId, email, 'super_admin', null)
  }

  const company = await getMyCompany(userId)
  if (company) {
    const emailRole = company.membership.role === 'company_admin' ? 'company_admin' : 'member'
    return syncEmailRoleAs(userId, email, emailRole, company.company.id)
  }

  return syncEmailRoleAs(userId, email, 'member', null)
}

export type SyncedDataRole = {
  role: 'super_admin' | 'company_admin' | 'member'
  companyId: string | null
}

async function syncDataRoleAs(
  userId: string,
  role: 'super_admin' | 'company_admin' | 'member',
  companyId: string | null,
): Promise<SyncedDataRole> {
  if (role === 'super_admin') {
    await syncDataUserRole({ userId, role: 'super_admin', companyId: null })
    return { role: 'super_admin', companyId: null }
  }

  if (role === 'company_admin' && companyId) {
    await syncDataUserRole({ userId, role: 'company_admin', companyId })
    return { role: 'company_admin', companyId }
  }

  await syncDataUserRole({ userId, role: 'member', companyId: companyId ?? null })
  return { role: 'member', companyId }
}

export async function syncDataRoleForUser(
  userId: string,
  sessionRole?: 'super_admin' | 'company_admin' | 'member',
  companyId?: string | null,
): Promise<SyncedDataRole> {
  if (sessionRole) {
    await assertCanAssumeSessionRole(userId, sessionRole, companyId)
    const effectiveCompanyId =
      sessionRole === 'super_admin' ? null : (companyId ?? (await getMyCompany(userId))?.company.id ?? null)
    return syncDataRoleAs(userId, sessionRole, effectiveCompanyId)
  }

  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) {
    return syncDataRoleAs(userId, 'super_admin', null)
  }

  const company = await getMyCompany(userId)
  if (company) {
    const dataRole = company.membership.role === 'company_admin' ? 'company_admin' : 'member'
    return syncDataRoleAs(userId, dataRole, company.company.id)
  }

  return syncDataRoleAs(userId, 'member', null)
}
