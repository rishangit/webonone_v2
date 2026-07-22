import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import type {
  RegisterCompanyBody,
  UpdateCompanyBody,
  UpdateCompanyStatusBody,
} from '../schemas/companySchemas.js'
import * as repo from '../repositories/company.repository.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import { sendTransactionalEmail } from './emailClient.service.js'

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export type CompanyDetail = {
  id: string
  name: string
  description: string | null
  companySize: string | null
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  mapPlaceId: string | null
  mapFormattedAddress: string | null
  status: repo.CompanyStatus
  createdByUserId: string
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  role?: 'member' | 'company_admin'
}

function toCompanyDetail(
  row: repo.CompanyRow,
  role?: 'member' | 'company_admin',
): CompanyDetail {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    companySize: row.company_size,
    logoUrl: row.logo_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    stateRegion: row.state_region,
    postalCode: row.postal_code,
    country: row.country,
    latitude: toNumberOrNull(row.latitude),
    longitude: toNumberOrNull(row.longitude),
    mapPlaceId: row.map_place_id,
    mapFormattedAddress: row.map_formatted_address,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
    ...(role ? { role } : {}),
  }
}

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

export type MyCompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  status: repo.CompanyStatus
  role: 'member' | 'company_admin'
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

export async function listMyCompanies(userId: string): Promise<MyCompanySummary[]> {
  const roles = await roleRepo.findCompanyRolesByUserId(userId)
  const companyIds = [
    ...new Set(
      roles
        .map((row) => row.company_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ]
  if (companyIds.length === 0) return []

  const companies = await repo.findCompaniesByIds(companyIds)
  const companyById = new Map(companies.map((row) => [row.id, row]))

  const items: MyCompanySummary[] = []
  for (const role of roles) {
    if (!role.company_id) continue
    const company = companyById.get(role.company_id)
    if (!company) continue

    items.push({
      id: company.id,
      name: company.name,
      logoUrl: company.logo_url,
      status: company.status,
      role: role.role === 'company_admin' ? 'company_admin' : 'member',
      createdAt: company.created_at.toISOString(),
      approvedAt: company.approved_at ? company.approved_at.toISOString() : null,
    })
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return items
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
    description: input.description?.trim() || null,
    company_size: input.companySize ?? null,
    logo_url: input.logoUrl ?? null,
    address_line1: input.addressLine1?.trim() || null,
    address_line2: input.addressLine2?.trim() || null,
    city: input.city?.trim() || null,
    state_region: input.stateRegion?.trim() || null,
    postal_code: input.postalCode?.trim() || null,
    country: input.country?.trim() || null,
    contact_email: input.contactEmail?.trim() || null,
    contact_phone: input.contactPhone?.trim() || null,
    latitude: null,
    longitude: null,
    map_place_id: null,
    map_formatted_address: null,
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

  return toCompanyWithMembership(company, role)
}

export async function getCompanyDetail(userId: string, companyId: string): Promise<CompanyDetail> {
  const company = await repo.findCompanyById(companyId)
  if (!company) {
    throw httpError('Company not found', 404)
  }

  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) {
    return toCompanyDetail(company)
  }

  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (!membership) {
    throw httpError('Company not found', 404)
  }

  const role = membership.role === 'company_admin' ? 'company_admin' : 'member'
  return toCompanyDetail(company, role)
}

export async function updateCompanyProfile(
  userId: string,
  companyId: string,
  input: UpdateCompanyBody,
): Promise<CompanyDetail> {
  const company = await repo.findCompanyById(companyId)
  if (!company) {
    throw httpError('Company not found', 404)
  }

  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  const isOwner = membership?.role === 'company_admin'

  if (!superAdmin && !isOwner) {
    throw httpError('Company not found', 404)
  }

  const patch: repo.CompanyProfilePatch = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description
  if (input.companySize !== undefined) patch.company_size = input.companySize
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl
  if (input.contactEmail !== undefined) patch.contact_email = input.contactEmail
  if (input.contactPhone !== undefined) patch.contact_phone = input.contactPhone
  if (input.addressLine1 !== undefined) patch.address_line1 = input.addressLine1
  if (input.addressLine2 !== undefined) patch.address_line2 = input.addressLine2
  if (input.city !== undefined) patch.city = input.city
  if (input.stateRegion !== undefined) patch.state_region = input.stateRegion
  if (input.postalCode !== undefined) patch.postal_code = input.postalCode
  if (input.country !== undefined) patch.country = input.country
  if (input.latitude !== undefined) patch.latitude = input.latitude
  if (input.longitude !== undefined) patch.longitude = input.longitude
  if (input.mapPlaceId !== undefined) patch.map_place_id = input.mapPlaceId
  if (input.mapFormattedAddress !== undefined) {
    patch.map_formatted_address = input.mapFormattedAddress
  }

  const updated = await repo.updateCompanyProfile(companyId, patch)
  if (!updated) {
    throw httpError('Company not found', 404)
  }

  if (superAdmin && !membership) {
    return toCompanyDetail(updated)
  }

  const role = membership?.role === 'company_admin' ? 'company_admin' : 'member'
  return toCompanyDetail(updated, role)
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
  } else if (input.status === 'rejected') {
    sendCompanyEmail('company_rejected', company)
  }

  return toCompanyWithMembership(company, role)
}

export async function seedSuperAdminFromEnv(): Promise<void> {
  if (!env.superAdminUserId) {
    console.warn('[seed] SUPER_ADMIN_USER_ID not set — skipping super_admin role seed (run identity seed)')
    return
  }

  await roleRepo.upsertSuperAdminRole(env.superAdminUserId, nanoid())
}

export type AssumableRoleOption = {
  role: 'super_admin' | 'company_admin' | 'member'
  companyId: string | null
  label: string
  companyName?: string
}

export type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  /** True when Super Admin and/or owned pending/approved companies — client shows Choose account dialog */
  requiresAccountSelection: boolean
  /** True when user owns ≥1 pending/approved company */
  hasCompanyMembership: boolean
}

const defaultUserOption: AssumableRoleOption = {
  role: 'member',
  companyId: null,
  label: 'Default User',
}

export async function getAssumableRoles(userId: string): Promise<AssumableRolesResponse> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  const companyRoles = await roleRepo.findCompanyRolesByUserId(userId)

  const ownedCompanyIds = [
    ...new Set(
      companyRoles
        .filter((row) => row.role === 'company_admin' && row.company_id)
        .map((row) => row.company_id as string),
    ),
  ]

  const companies =
    ownedCompanyIds.length > 0 ? await repo.findCompaniesByIds(ownedCompanyIds) : []
  const companyById = new Map(companies.map((row) => [row.id, row]))

  const ownedCompanies = ownedCompanyIds
    .map((id) => companyById.get(id))
    .filter((company): company is repo.CompanyRow => {
      if (!company) return false
      return company.status === 'pending' || company.status === 'approved'
    })
    .sort((a, b) => b.created_at.toISOString().localeCompare(a.created_at.toISOString()))

  const hasCompanyMembership = ownedCompanies.length > 0
  const requiresAccountSelection = Boolean(superAdmin) || hasCompanyMembership

  if (!requiresAccountSelection) {
    return {
      roles: [defaultUserOption],
      requiresAccountSelection: false,
      hasCompanyMembership: false,
    }
  }

  const roles: AssumableRoleOption[] = [defaultUserOption]

  if (superAdmin) {
    roles.push({ role: 'super_admin', companyId: null, label: 'Super Admin' })
  }

  for (const company of ownedCompanies) {
    roles.push({
      role: 'company_admin',
      companyId: company.id,
      label: company.name,
      companyName: company.name,
    })
  }

  return { roles, requiresAccountSelection: true, hasCompanyMembership }
}
