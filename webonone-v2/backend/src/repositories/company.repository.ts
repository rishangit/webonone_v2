import { db } from '../models/db.js'

export type CompanyStatus = 'pending' | 'approved' | 'rejected'

export type CompanyRow = {
  id: string
  name: string
  description: string | null
  company_size: string | null
  logo_url: string | null
  gallery_images: string | CompanyGalleryImageRef[] | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state_region: string | null
  postal_code: string | null
  country: string | null
  contact_email: string | null
  contact_phone: string | null
  latitude: string | number | null
  longitude: string | number | null
  map_place_id: string | null
  map_formatted_address: string | null
  status: CompanyStatus
  created_by_user_id: string
  created_at: Date
  updated_at: Date
  approved_at: Date | null
  approved_by_user_id: string | null
}

export type CompanyGalleryImageRef = {
  mediaId: string
  url: string
}

export type CompanyProfilePatch = {
  name?: string
  description?: string | null
  company_size?: string | null
  logo_url?: string | null
  gallery_images?: CompanyGalleryImageRef[] | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state_region?: string | null
  postal_code?: string | null
  country?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  latitude?: number | null
  longitude?: number | null
  map_place_id?: string | null
  map_formatted_address?: string | null
}

export async function findCompanyById(id: string): Promise<CompanyRow | undefined> {
  return db<CompanyRow>('companies').where({ id }).first()
}

export async function findCompaniesByIds(ids: string[]): Promise<CompanyRow[]> {
  if (ids.length === 0) return []
  return db<CompanyRow>('companies').whereIn('id', ids)
}

export async function insertCompany(
  row: Omit<CompanyRow, 'created_at' | 'updated_at' | 'approved_at' | 'approved_by_user_id'>,
): Promise<void> {
  await db('companies').insert({
    ...row,
    approved_at: null,
    approved_by_user_id: null,
  })
}

export async function listPendingCompanies(): Promise<CompanyRow[]> {
  return db<CompanyRow>('companies').where({ status: 'pending' }).orderBy('created_at', 'asc')
}

export async function listAllCompanies(): Promise<CompanyRow[]> {
  return db<CompanyRow>('companies').orderBy('created_at', 'desc')
}

export type CompanyTagRow = {
  id: number
  company_id: string
  tag_id: string
  name: string
  color: string
  sort_order: number
  created_at: Date
}

export type CompanyTagSnapshot = {
  id: string
  name: string
  color: string
}

export async function listCompanyTags(companyId: string): Promise<CompanyTagRow[]> {
  return db<CompanyTagRow>('company_tags')
    .where({ company_id: companyId })
    .orderBy([
      { column: 'sort_order', order: 'asc' },
      { column: 'id', order: 'asc' },
    ])
}

export async function updateCompanyProfile(
  companyId: string,
  patch: CompanyProfilePatch,
  tags?: CompanyTagSnapshot[],
): Promise<CompanyRow | undefined> {
  const hasPatch = Object.keys(patch).length > 0
  const hasTags = tags !== undefined

  if (!hasPatch && !hasTags) {
    return findCompanyById(companyId)
  }

  await db.transaction(async (trx) => {
    if (hasPatch) {
      // Knex/mysql treat JS arrays as special bindings — stringify JSON columns explicitly.
      const { gallery_images: galleryImages, ...rest } = patch
      const updatePayload: Record<string, unknown> = {
        ...rest,
        updated_at: db.fn.now(3),
      }
      if (galleryImages !== undefined) {
        updatePayload.gallery_images =
          galleryImages === null ? null : JSON.stringify(galleryImages)
      }

      const updated = await trx<CompanyRow>('companies')
        .where({ id: companyId })
        .update(updatePayload)
      if (!updated) {
        throw new Error('COMPANY_NOT_FOUND')
      }
    }

    if (hasTags) {
      await trx('company_tags').where({ company_id: companyId }).delete()
      if (tags.length > 0) {
        await trx('company_tags').insert(
          tags.map((tag, index) => ({
            company_id: companyId,
            tag_id: tag.id,
            name: tag.name,
            color: tag.color,
            sort_order: index,
          })),
        )
      }
    }
  })

  return findCompanyById(companyId)
}

export async function updateCompanyStatus(
  companyId: string,
  status: CompanyStatus,
  approvedByUserId: string | null,
): Promise<CompanyRow | undefined> {
  const now = db.fn.now(3)
  const patch: Partial<CompanyRow> = {
    status,
    updated_at: now as unknown as Date,
  }

  if (status === 'approved') {
    patch.approved_at = now as unknown as Date
    patch.approved_by_user_id = approvedByUserId
  } else {
    patch.approved_at = null
    patch.approved_by_user_id = null
  }

  const updated = await db<CompanyRow>('companies').where({ id: companyId }).update(patch)
  if (!updated) return undefined
  return findCompanyById(companyId)
}

export async function approveCompany(
  companyId: string,
  approvedByUserId: string,
): Promise<CompanyRow | undefined> {
  const now = db.fn.now(3)
  const updated = await db<CompanyRow>('companies')
    .where({ id: companyId, status: 'pending' })
    .update({
      status: 'approved',
      approved_at: now,
      approved_by_user_id: approvedByUserId,
      updated_at: now,
    })

  if (!updated) return undefined
  return findCompanyById(companyId)
}
