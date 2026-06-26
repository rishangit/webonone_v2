import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import type { RegisterCompanyBody, SuperAdminLoginBody } from '../schemas/companySchemas.js'
import * as repo from '../repositories/company.repository.js'

export type CompanyWithMembership = {
  company: {
    id: string
    name: string
    logoUrl: string | null
    status: 'pending' | 'approved'
    createdAt: string
    approvedAt: string | null
  }
  membership: {
    role: 'member' | 'company_admin'
  }
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

  return toCompanyWithMembership(company, membership)
}

export async function listPendingCompanies() {
  const rows = await repo.listPendingCompanies()
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function approveCompany(companyId: string, superAdminId: string) {
  const company = await repo.approveCompany(companyId, superAdminId)
  if (!company) {
    const err = new Error('Company not found or not pending')
    ;(err as Error & { statusCode: number }).statusCode = 404
    throw err
  }

  await repo.promoteUserToCompanyAdmin(company.id, company.created_by_user_id)

  const membership = await repo.findMembershipByUserId(company.created_by_user_id)
  if (!membership) {
    throw new Error('Membership not found after approval')
  }

  return toCompanyWithMembership(company, membership)
}

export async function loginSuperAdmin(input: SuperAdminLoginBody): Promise<{ accessToken: string; displayName: string }> {
  const admin = await repo.findSuperAdminByEmail(input.email)
  if (!admin) {
    const err = new Error('Invalid credentials')
    ;(err as Error & { statusCode: number }).statusCode = 401
    throw err
  }

  const valid = await bcrypt.compare(input.password, admin.password_hash)
  if (!valid) {
    const err = new Error('Invalid credentials')
    ;(err as Error & { statusCode: number }).statusCode = 401
    throw err
  }

  const accessToken = jwt.sign(
    { email: admin.email },
    env.superAdminJwtSecret,
    {
      subject: admin.id,
      issuer: env.superAdminJwtIssuer,
      audience: env.superAdminJwtAudience,
      expiresIn: '8h',
    },
  )

  return { accessToken, displayName: admin.display_name }
}

export async function seedSuperAdminFromEnv(): Promise<void> {
  const passwordHash = await bcrypt.hash(env.superAdminPassword, 12)
  await repo.upsertSuperAdmin({
    id: nanoid(),
    email: env.superAdminEmail,
    passwordHash,
    displayName: env.superAdminDisplayName,
  })
}
