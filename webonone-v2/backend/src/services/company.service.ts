import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import {
  rewriteMediaFileUrl,
  rewriteOptionalMediaFileUrl,
} from '../utils/rewriteMediaFileUrl.js'
import type {
  CompanyDataEntity,
  RegisterCompanyBody,
  UpdateCompanyBody,
  UpdateCompanyStatusBody,
} from '../schemas/companySchemas.js'
import * as repo from '../repositories/company.repository.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import * as staffRepo from '../repositories/companyStaff.repository.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import { ensureWelcomeTemplate as ensureEmailWelcomeTemplate, sendTransactionalEmail } from './emailClient.service.js'
import { ensureWelcomeTemplate as ensureSmsWelcomeTemplate } from './smsClient.service.js'
import { upsertPaymentCompany } from './paymentClient.service.js'
import {
  notifyCompanyPendingReview,
  notifyCompanyStatusChange,
} from './inAppNotify.service.js'
import { fetchUserContact } from '../clients/identityUserContactClient.js'

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

export type CompanyGalleryImage = {
  mediaId: string
  url: string
}

export type CompanyTag = {
  id: string
  name: string
  color: string
}

export type CompanyCatalogCounts = {
  products: number
  services: number
  spaces: number
}

export type CompanyContactPerson = {
  id: string
  displayName: string
  email: string | null
}

export type CompanyDetail = {
  id: string
  name: string
  description: string | null
  companySize: string | null
  logoUrl: string | null
  galleryImages: CompanyGalleryImage[]
  contactEmail: string | null
  contactPhone: string | null
  contactPersonUserId: string | null
  contactPerson: CompanyContactPerson | null
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
  tags: CompanyTag[]
  dataEntities: CompanyDataEntity[]
  catalogCounts: CompanyCatalogCounts
  status: repo.CompanyStatus
  createdByUserId: string
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  role?: 'member' | 'company_admin'
}

const ALLOWED_DATA_ENTITIES = new Set<CompanyDataEntity>([
  'tags',
  'units',
  'attributes',
  'products',
  'services',
  'spaces',
])

function parseDataEntities(
  value: string | CompanyDataEntity[] | null | undefined,
): CompanyDataEntity[] {
  if (value == null) return []
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  const seen = new Set<CompanyDataEntity>()
  const result: CompanyDataEntity[] = []
  for (const item of parsed) {
    if (typeof item !== 'string') continue
    if (!ALLOWED_DATA_ENTITIES.has(item as CompanyDataEntity)) continue
    const key = item as CompanyDataEntity
    if (seen.has(key)) continue
    seen.add(key)
    result.push(key)
  }
  return result
}

function parseGalleryImages(
  value: string | repo.CompanyGalleryImageRef[] | null | undefined,
): CompanyGalleryImage[] {
  if (value == null) return []
  let parsed: unknown = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter(
      (item): item is CompanyGalleryImage =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as CompanyGalleryImage).mediaId === 'string' &&
        typeof (item as CompanyGalleryImage).url === 'string',
    )
    .map((item) => ({ ...item, url: rewriteMediaFileUrl(item.url) }))
    .slice(0, 24)
}

function toCompanyDetail(
  row: repo.CompanyRow,
  tags: CompanyTag[] = [],
  catalogCounts: CompanyCatalogCounts = { products: 0, services: 0, spaces: 0 },
  role?: 'member' | 'company_admin',
  contactPerson: CompanyContactPerson | null = null,
): CompanyDetail {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    companySize: row.company_size,
    logoUrl: rewriteOptionalMediaFileUrl(row.logo_url),
    galleryImages: parseGalleryImages(row.gallery_images),
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    contactPersonUserId: row.contact_person_user_id,
    contactPerson,
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
    tags,
    dataEntities: parseDataEntities(row.data_entities),
    catalogCounts,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
    ...(role ? { role } : {}),
  }
}

async function loadCompanyTags(companyId: string): Promise<CompanyTag[]> {
  const rows = await repo.listCompanyTags(companyId)
  return rows.map((row) => ({
    id: row.tag_id,
    name: row.name,
    color: row.color,
  }))
}

async function resolveContactPerson(
  userId: string | null,
): Promise<CompanyContactPerson | null> {
  if (!userId) return null
  const contact = await fetchUserContact(userId)
  if (!contact) return null
  return {
    id: contact.id,
    displayName: contact.displayName,
    email: contact.email,
  }
}

async function toCompanyDetailWithTags(
  row: repo.CompanyRow,
  role?: 'member' | 'company_admin',
): Promise<CompanyDetail> {
  const [tags, catalogCounts, contactPerson] = await Promise.all([
    loadCompanyTags(row.id),
    catalogRepo.countByCompanyForEntityKinds(row.id),
    resolveContactPerson(row.contact_person_user_id),
  ])
  return toCompanyDetail(row, tags, catalogCounts, role, contactPerson)
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
  dataEntities: CompanyDataEntity[]
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
      logoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
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
    logoUrl: rewriteOptionalMediaFileUrl(row.logo_url),
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
  const ownedCompanies = await repo.findCompaniesCreatedByUserId(userId)
  const byId = new Map<string, MyCompanySummary>()

  const roleCompanyIds = [
    ...new Set(
      roles
        .map((row) => row.company_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ]
  const companiesFromRoles =
    roleCompanyIds.length > 0 ? await repo.findCompaniesByIds(roleCompanyIds) : []
  const companyById = new Map(companiesFromRoles.map((row) => [row.id, row]))

  for (const role of roles) {
    if (!role.company_id) continue
    const company = companyById.get(role.company_id)
    if (!company) continue

    const nextRole = role.role === 'company_admin' ? 'company_admin' : 'member'
    const existing = byId.get(company.id)
    // Prefer company_admin when the user has both roles on the same company.
    if (existing?.role === 'company_admin' && nextRole === 'member') continue

    byId.set(company.id, {
      id: company.id,
      name: company.name,
      logoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
      status: company.status,
      role: nextRole,
      dataEntities: parseDataEntities(company.data_entities),
      createdAt: company.created_at.toISOString(),
      approvedAt: company.approved_at ? company.approved_at.toISOString() : null,
    })
  }

  // Creator fallback + heal: company rows can exist when Identity role insert timed out.
  for (const company of ownedCompanies) {
    if (byId.get(company.id)?.role === 'company_admin') continue

    try {
      await roleRepo.insertUserRole({
        id: nanoid(),
        user_id: userId,
        role: 'company_admin',
        company_id: company.id,
      })
    } catch {
      // Keep listing via created_by even if Identity is temporarily unavailable.
    }

    byId.set(company.id, {
      id: company.id,
      name: company.name,
      logoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
      status: company.status,
      role: 'company_admin',
      dataEntities: parseDataEntities(company.data_entities),
      createdAt: company.created_at.toISOString(),
      approvedAt: company.approved_at ? company.approved_at.toISOString() : null,
    })
  }

  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export type DiscoverCompanySummary = {
  id: string
  name: string
  logoUrl: string | null
  description: string | null
  city: string | null
  country: string | null
  contactEmail: string | null
}

export type DiscoverCompaniesResult = {
  items: DiscoverCompanySummary[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

function toDiscoverCompanySummary(row: repo.CompanyRow): DiscoverCompanySummary {
  return {
    id: row.id,
    name: row.name,
    logoUrl: rewriteOptionalMediaFileUrl(row.logo_url),
    description: row.description,
    city: row.city,
    country: row.country,
    contactEmail: row.contact_email,
  }
}

/** Approved company with no existing Identity role — discover search/detail/catalog preview. */
export async function assertDiscoverableCompany(
  userId: string,
  companyId: string,
): Promise<repo.CompanyRow> {
  const company = await repo.findCompanyById(companyId)
  if (!company || company.status !== 'approved') {
    throw httpError('Company not found', 404)
  }

  const existing = await roleRepo.findCompanyRole(userId, companyId)
  if (existing) {
    throw httpError('Company not found', 404)
  }

  return company
}

export async function getDiscoverableCompanyDetail(
  userId: string,
  companyId: string,
): Promise<CompanyDetail> {
  const company = await assertDiscoverableCompany(userId, companyId)
  return toCompanyDetailWithTags(company, 'member')
}

export async function searchDiscoverableCompanies(
  userId: string,
  input: { q?: string; page: number; pageSize: number },
): Promise<DiscoverCompaniesResult> {
  const roles = await roleRepo.findCompanyRolesByUserId(userId)
  const excludeCompanyIds = [
    ...new Set(
      roles
        .map((row) => row.company_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ]

  const { items, total } = await repo.searchApprovedCompanies({
    q: input.q,
    page: input.page,
    pageSize: input.pageSize,
    excludeCompanyIds,
  })

  return {
    items: items.map(toDiscoverCompanySummary),
    total,
    page: input.page,
    pageSize: input.pageSize,
    hasMore: input.page * input.pageSize < total,
  }
}

export async function connectToCompany(
  userId: string,
  companyId: string,
): Promise<MyCompanySummary> {
  const company = await repo.findCompanyById(companyId)
  if (!company || company.status !== 'approved') {
    throw httpError('Company not found', 404)
  }

  const existing = await roleRepo.findCompanyRole(userId, companyId)
  if (existing) {
    if (existing.role === 'company_admin') {
      throw httpError('You already own this company', 409)
    }
    throw httpError('Already connected to this company', 409)
  }

  await roleRepo.ensureCompanyMemberRole(userId, companyId, nanoid())

  return {
    id: company.id,
    name: company.name,
    logoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
    status: company.status,
    role: 'member',
    dataEntities: parseDataEntities(company.data_entities),
    createdAt: company.created_at.toISOString(),
    approvedAt: company.approved_at ? company.approved_at.toISOString() : null,
  }
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
    gallery_images: null,
    data_entities: [],
    address_line1: input.addressLine1?.trim() || null,
    address_line2: input.addressLine2?.trim() || null,
    city: input.city?.trim() || null,
    state_region: input.stateRegion?.trim() || null,
    postal_code: input.postalCode?.trim() || null,
    country: input.country?.trim() || null,
    contact_email: input.contactEmail?.trim() || null,
    contact_phone: input.contactPhone?.trim() || null,
    contact_person_user_id: input.contactPersonUserId,
    latitude: null,
    longitude: null,
    map_place_id: null,
    map_formatted_address: null,
    status: 'pending',
    created_by_user_id: userId,
  })

  try {
    await roleRepo.insertUserRole({
      id: roleId,
      user_id: userId,
      role: 'company_admin',
      company_id: companyId,
    })
  } catch (err) {
    await repo.deleteCompanyById(companyId)
    throw err
  }

  const company = await repo.findCompanyById(companyId)
  const role = await roleRepo.findCompanyRole(userId, companyId)
  if (!company || !role) {
    if (company) {
      await repo.deleteCompanyById(companyId)
    }
    throw new Error('Failed to create company')
  }

  sendCompanyEmail('company_registered', company)
  void notifyCompanyPendingReview({
    companyId: company.id,
    companyName: company.name,
  }).catch((err) => {
    console.error('[company] in-app pending review notify failed:', err)
  })

  // Soft-fail: registration succeeds even if Email/SMS are down.
  void ensureEmailWelcomeTemplate(companyId, company.name).catch((err) => {
    console.error('[company] ensure email welcome template failed:', err)
  })
  void ensureSmsWelcomeTemplate(companyId, company.name).catch((err) => {
    console.error('[company] ensure SMS welcome template failed:', err)
  })

  return toCompanyWithMembership(company, role)
}

export async function getCompanyDetail(userId: string, companyId: string): Promise<CompanyDetail> {
  const company = await repo.findCompanyById(companyId)
  if (!company) {
    throw httpError('Company not found', 404)
  }

  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) {
    return toCompanyDetailWithTags(company)
  }

  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (!membership) {
    throw httpError('Company not found', 404)
  }

  const role = membership.role === 'company_admin' ? 'company_admin' : 'member'
  return toCompanyDetailWithTags(company, role)
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
  if (input.galleryImages !== undefined) patch.gallery_images = input.galleryImages
  if (input.contactEmail !== undefined) patch.contact_email = input.contactEmail
  if (input.contactPhone !== undefined) patch.contact_phone = input.contactPhone
  if (input.contactPersonUserId !== undefined) {
    patch.contact_person_user_id = input.contactPersonUserId
  }
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
  if (input.dataEntities !== undefined) {
    patch.data_entities = [...new Set(input.dataEntities)]
  }

  const tags =
    input.tags !== undefined
      ? input.tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }))
      : undefined

  let updated: repo.CompanyRow | undefined
  try {
    updated = await repo.updateCompanyProfile(companyId, patch, tags)
  } catch (err) {
    if (err instanceof Error && err.message === 'COMPANY_NOT_FOUND') {
      throw httpError('Company not found', 404)
    }
    throw err
  }
  if (!updated) {
    throw httpError('Company not found', 404)
  }

  if (superAdmin && !membership) {
    return toCompanyDetailWithTags(updated)
  }

  const role = membership?.role === 'company_admin' ? 'company_admin' : 'member'
  return toCompanyDetailWithTags(updated, role)
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
    void notifyCompanyStatusChange({
      companyId: company.id,
      companyName: company.name,
      status: 'approved',
      registrantUserId: company.created_by_user_id,
    }).catch((err) => {
      console.error('[company] in-app approved notify failed:', err)
    })
    void upsertPaymentCompany({
      companyId: company.id,
      name: company.name,
      activatedAt: company.approved_at ? company.approved_at.toISOString() : new Date().toISOString(),
      status: 'active',
    })
  } else if (input.status === 'rejected') {
    sendCompanyEmail('company_rejected', company)
    void notifyCompanyStatusChange({
      companyId: company.id,
      companyName: company.name,
      status: 'rejected',
      registrantUserId: company.created_by_user_id,
    }).catch((err) => {
      console.error('[company] in-app rejected notify failed:', err)
    })
    void upsertPaymentCompany({
      companyId: company.id,
      name: company.name,
      status: 'inactive',
    })
  } else {
    void upsertPaymentCompany({
      companyId: company.id,
      name: company.name,
      status: 'inactive',
    })
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
  companyLogoUrl?: string | null
  dataEntities?: CompanyDataEntity[]
  /** Present when this company card is from company_staff (not owner). */
  accountKind?: 'staff'
}

export type AssumableRolesResponse = {
  roles: AssumableRoleOption[]
  /** True when Super Admin, owned companies, and/or staff companies — client shows Choose account dialog */
  requiresAccountSelection: boolean
  /** True when user owns ≥1 pending/approved company */
  hasCompanyMembership: boolean
}

const defaultUserOption: AssumableRoleOption = {
  role: 'member',
  companyId: null,
  label: 'Default User',
}

function isSelectableCompanyStatus(status: repo.CompanyStatus): boolean {
  return status === 'pending' || status === 'approved'
}

export async function getAssumableRoles(userId: string): Promise<AssumableRolesResponse> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  const companyRoles = await roleRepo.findCompanyRolesByUserId(userId)
  const staffRows = await staffRepo.listStaffByUserId(userId)

  const ownedCompanyIds = [
    ...new Set(
      companyRoles
        .filter((row) => row.role === 'company_admin' && row.company_id)
        .map((row) => row.company_id as string),
    ),
  ]

  const staffCompanyIds = [...new Set(staffRows.map((row) => row.company_id))]
  const companyIdsToLoad = [...new Set([...ownedCompanyIds, ...staffCompanyIds])]

  const companies =
    companyIdsToLoad.length > 0 ? await repo.findCompaniesByIds(companyIdsToLoad) : []
  const companyById = new Map(companies.map((row) => [row.id, row]))

  const ownedCompanies = ownedCompanyIds
    .map((id) => companyById.get(id))
    .filter((company): company is repo.CompanyRow => {
      if (!company) return false
      return isSelectableCompanyStatus(company.status)
    })
    .sort((a, b) => b.created_at.toISOString().localeCompare(a.created_at.toISOString()))

  // Include staff cards even when the user also owns the company so they can
  // choose Company Owner vs Staff for the same company.
  const staffCompanies = staffCompanyIds
    .map((id) => companyById.get(id))
    .filter((company): company is repo.CompanyRow => {
      if (!company) return false
      return isSelectableCompanyStatus(company.status)
    })
    .sort((a, b) => b.created_at.toISOString().localeCompare(a.created_at.toISOString()))

  for (const company of staffCompanies) {
    // Owners typically only have company_admin; ensure still no-ops if any role exists.
    // Identity allows assuming member+companyId when company_admin is present.
    await roleRepo.ensureCompanyMemberRole(userId, company.id, nanoid())
  }

  const hasCompanyMembership = ownedCompanies.length > 0
  const requiresAccountSelection =
    Boolean(superAdmin) || hasCompanyMembership || staffCompanies.length > 0

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
      companyLogoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
      dataEntities: parseDataEntities(company.data_entities),
    })
  }

  for (const company of staffCompanies) {
    roles.push({
      role: 'member',
      companyId: company.id,
      label: `${company.name} (Staff)`,
      companyName: company.name,
      companyLogoUrl: rewriteOptionalMediaFileUrl(company.logo_url),
      dataEntities: parseDataEntities(company.data_entities),
      accountKind: 'staff',
    })
  }

  return { roles, requiresAccountSelection: true, hasCompanyMembership }
}
