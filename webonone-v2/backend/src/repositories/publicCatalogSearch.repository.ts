import { db } from '../models/db.js'
import { rewriteMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'
import type { CatalogKind } from '../clients/dataCatalogClient.js'
import { CATALOG_TABLE_BY_KIND } from './companyCatalog.repository.js'

export type PublicCatalogSearchRow = {
  id: string
  company_id: string
  company_name: string
  company_logo_url: string | null
  company_latitude: string | number | null
  company_longitude: string | number | null
  binding_mode: 'linked' | 'forked' | 'custom'
  library_entity_id: string | null
  name: string | null
  description: string | null
  status: 'verified' | 'pending' | null
  tag_ids: string | unknown[] | null
  kind: CatalogKind
  gallery_images?: string | unknown[] | null
  /** Services only — null for products/spaces and linked rows without local copy. */
  time_mode?: 'duration' | 'window' | null
  duration_minutes?: number | null
  start_time?: string | Date | null
  end_time?: string | Date | null
}

const BASE_ITEM_SELECT = [
  'item.id',
  'item.company_id',
  'company.name as company_name',
  'company.logo_url as company_logo_url',
  'company.latitude as company_latitude',
  'company.longitude as company_longitude',
  'item.binding_mode',
  'item.library_entity_id',
  'item.name',
  'item.description',
  'item.status',
  'item.tag_ids',
  'item.gallery_images',
] as const

const SERVICE_TIME_SELECT = [
  'item.time_mode',
  'item.duration_minutes',
  'item.start_time',
  'item.end_time',
] as const

function selectForKind(kind: CatalogKind): string[] {
  return [
    ...BASE_ITEM_SELECT,
    ...(kind === 'services' ? SERVICE_TIME_SELECT : []),
  ]
}

const SELLABLE_KINDS: CatalogKind[] = ['products', 'services', 'spaces']

export function isSellableCatalogKind(value: string): value is CatalogKind {
  return (SELLABLE_KINDS as readonly string[]).includes(value)
}

export function parseGalleryImages(
  value: string | unknown[] | null | undefined,
): { mediaId: string; url: string }[] {
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
      (item): item is { mediaId: string; url: string } =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as { mediaId?: unknown }).mediaId === 'string' &&
        typeof (item as { url?: unknown }).url === 'string',
    )
    .map((item) => ({ ...item, url: rewriteMediaFileUrl(item.url) }))
}

function parseJsonStringArray(value: string | unknown[] | null): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed.filter((entry): entry is string => typeof entry === 'string')
    } catch {
      return []
    }
  }
  return []
}

export function parseTagIds(value: string | unknown[] | null): string[] {
  return parseJsonStringArray(value)
}

/**
 * Find company catalog sellables matching text and/or tag / library filters.
 * Approved companies only. Linked, customized (forked), and custom rows are included
 * when `web_publish_status` is published — catalog verification status is not a gate.
 */
export async function searchApprovedCompanyCatalog(options: {
  q: string
  matchedTagIds: string[]
  libraryIdsByKind: Record<CatalogKind, string[]>
}): Promise<PublicCatalogSearchRow[]> {
  const { q, matchedTagIds, libraryIdsByKind } = options
  const pattern = `%${q}%`
  const rows: PublicCatalogSearchRow[] = []

  for (const kind of SELLABLE_KINDS) {
    const table = CATALOG_TABLE_BY_KIND[kind]
    const libraryIds = libraryIdsByKind[kind] ?? []

    const query = db(`${table} as item`)
      .join('companies as company', 'company.id', 'item.company_id')
      .where('company.status', 'approved')
      .andWhere('item.web_publish_status', 'published')
      .andWhere(function match() {
        this.where('item.name', 'like', pattern).orWhere('item.description', 'like', pattern)

        if (matchedTagIds.length > 0) {
          for (const tagId of matchedTagIds) {
            this.orWhereRaw('JSON_CONTAINS(item.tag_ids, CAST(? AS JSON), \'$\')', [
              JSON.stringify(tagId),
            ])
          }
        }

        if (libraryIds.length > 0) {
          this.orWhere(function libraryCopy() {
            this.whereIn('item.binding_mode', ['linked', 'forked']).whereIn(
              'item.library_entity_id',
              libraryIds,
            )
          })
        }
      })
      .select(...selectForKind(kind))
      .orderBy('item.updated_at', 'desc')
      .limit(500)

    const kindRows = (await query) as Array<Omit<PublicCatalogSearchRow, 'kind'>>
    for (const row of kindRows) {
      rows.push({ ...row, kind })
    }
  }

  return rows
}

/**
 * Load one marketplace sellable by kind + id.
 * Approved company and published — linked, customized, and custom.
 */
export async function findApprovedCompanyCatalogById(
  kind: CatalogKind,
  id: string,
): Promise<PublicCatalogSearchRow | null> {
  if (!isSellableCatalogKind(kind)) return null

  const table = CATALOG_TABLE_BY_KIND[kind]
  const row = (await db(`${table} as item`)
    .join('companies as company', 'company.id', 'item.company_id')
    .where('item.id', id)
    .where('company.status', 'approved')
    .andWhere('item.web_publish_status', 'published')
    .select(...selectForKind(kind))
    .first()) as Omit<PublicCatalogSearchRow, 'kind'> | undefined

  if (!row) return null
  return { ...row, kind }
}

export type NearbyCompanyRow = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  latitude: string | number | null
  longitude: string | number | null
}

/** Approved companies that have a map pin (nearby home listing). */
export async function listApprovedCompaniesWithCoordinates(): Promise<NearbyCompanyRow[]> {
  const rows = (await db('companies')
    .where('status', 'approved')
    .whereNotNull('latitude')
    .whereNotNull('longitude')
    .select('id', 'name', 'description', 'logo_url', 'latitude', 'longitude')) as NearbyCompanyRow[]
  return rows
}

/**
 * Published catalog rows for the given approved companies.
 * Linked, customized, and custom — same publish rule as text search.
 */
export async function listApprovedCatalogByCompanyIds(
  companyIds: string[],
): Promise<PublicCatalogSearchRow[]> {
  if (companyIds.length === 0) return []

  const rows: PublicCatalogSearchRow[] = []
  for (const kind of SELLABLE_KINDS) {
    const table = CATALOG_TABLE_BY_KIND[kind]
    const query = db(`${table} as item`)
      .join('companies as company', 'company.id', 'item.company_id')
      .whereIn('item.company_id', companyIds)
      .where('company.status', 'approved')
      .andWhere('item.web_publish_status', 'published')
      .select(...selectForKind(kind))

    const kindRows = (await query) as Array<Omit<PublicCatalogSearchRow, 'kind'>>
    for (const row of kindRows) {
      rows.push({ ...row, kind })
    }
  }

  return rows
}
