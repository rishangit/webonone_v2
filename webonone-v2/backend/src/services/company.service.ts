import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import type { RegisterCompanyBody, UpdateCompanyStatusBody } from '../schemas/companySchemas.js'
import * as repo from '../repositories/company.repository.js'
import { sendTransactionalEmail, syncUserRole } from './emailClient.service.js'

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
  membership: repo.MembershipRow,
): CompanyWithMembership {
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
      role: membership.role,
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
  const membership = await repo.findMembershipByUserId(userId)
  if (!membership) return null

  const company = await repo.findCompanyById(membership.company_id)
  if (!company) return null

  return toCompanyWithMembership(company, membership)
}

export async function registerCompany(
  userId: string,
  input: RegisterCompanyBody,
): Promise<CompanyWithMembership> {
  const existing = await repo.findMembershipByUserId(userId)
  if (existing) {
    const err = new Error('User already belongs to a company')
    ;(err as Error & { statusCode: number }).statusCode = 409
    throw err
  }

  const companyId = nanoid()
  const membershipId = nanoid()

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

  await repo.insertMembership({
    id: membershipId,
    company_id: companyId,
    user_id: userId,
    role: 'member',
  })

  const company = await repo.findCompanyById(companyId)
  const membership = await repo.findMembershipByUserId(userId)
  if (!company || !membership) {
    throw new Error('Failed to create company')
  }

  sendCompanyEmail('company_registered', company)
  syncCompanyMemberRole(userId, 'member', company)

  return toCompanyWithMembership(company, membership)
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

export async function getSuperAdminProfile(email: string) {
  const admin = await repo.findSuperAdminByEmail(email)
  if (!admin) return null
  return {
    id: admin.id,
    email: admin.email,
    displayName: admin.display_name,
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

export async function approveCompany(companyId: string, superAdminId: string) {
  return updateCompanyStatus(companyId, { status: 'approved' }, superAdminId)
}

export async function updateCompanyStatus(
  companyId: string,
  input: UpdateCompanyStatusBody,
  superAdminId: string,
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
    input.status === 'approved' ? superAdminId : null,
  )
  if (!company) {
    const err = new Error('Company not found')
    ;(err as Error & { statusCode: number }).statusCode = 404
    throw err
  }

  if (input.status === 'approved') {
    await repo.promoteUserToCompanyAdmin(company.id, company.created_by_user_id)
  } else {
    await repo.demoteUserToMember(company.id, company.created_by_user_id)
  }

  const membership = await repo.findMembershipByUserId(company.created_by_user_id)
  if (!membership) {
    throw new Error('Membership not found after status update')
  }

  if (input.status === 'approved') {
    sendCompanyEmail('company_approved', company)
    syncCompanyMemberRole(company.created_by_user_id, 'company_admin', company)
  } else if (input.status === 'rejected') {
    sendCompanyEmail('company_rejected', company)
    syncCompanyMemberRole(company.created_by_user_id, 'member', company)
  }

  return toCompanyWithMembership(company, membership)
}

export async function seedSuperAdminFromEnv(): Promise<void> {
  await repo.upsertSuperAdmin({
    id: nanoid(),
    email: env.superAdminEmail,
    displayName: env.superAdminDisplayName,
  })
}

export type SyncedEmailRole = {
  role: 'super_admin' | 'company_admin' | 'member'
  companyId: string | null
}

export async function syncEmailRoleForUser(
  userId: string,
  email: string,
): Promise<SyncedEmailRole> {
  const superAdmin = await getSuperAdminProfile(email)
  if (superAdmin) {
    await syncUserRole({
      userId,
      role: 'super_admin',
      email,
      displayName: superAdmin.displayName,
    })
    return { role: 'super_admin', companyId: null }
  }

  const company = await getMyCompany(userId)
  if (company) {
    const emailRole = company.membership.role === 'company_admin' ? 'company_admin' : 'member'
    await syncUserRole({
      userId,
      role: emailRole,
      companyId: company.company.id,
      email,
      displayName: company.company.name,
    })
    return { role: emailRole, companyId: company.company.id }
  }

  await syncUserRole({
    userId,
    role: 'member',
    email,
  })
  return { role: 'member', companyId: null }
}
