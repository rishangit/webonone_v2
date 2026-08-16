import { db } from '../models/db.js'
import { rewriteMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'
import type {
  CatalogBindingMode,
  CatalogEntityKind,
  CatalogPayload,
} from '../schemas/companyCatalogSchemas.js'

export const CATALOG_TABLE_BY_KIND: Record<CatalogEntityKind, string> = {
  tags: 'company_catalog_tags',
  units: 'company_units',
  attributes: 'company_attributes',
  products: 'company_products',
  services: 'company_services',
  spaces: 'company_spaces',
}

type CommonRow = {
  id: string
  company_id: string
  binding_mode: CatalogBindingMode
  library_entity_id: string | null
  name: string | null
  description: string | null
  status: 'verified' | 'pending' | null
  created_at: Date
  updated_at: Date
}

type TagRow = CommonRow & { color: string | null }
type UnitRow = CommonRow & {
  symbol: string | null
  is_base: boolean | number | null
  base_unit_id: string | null
}
type AttributeRow = CommonRow & {
  value_type: 'number' | 'text' | null
  unit_id: string | null
}
type ProductOrSpaceRow = CommonRow & {
  tag_ids: string | unknown[] | null
  attributes: string | unknown[] | null
}
type ServiceRow = ProductOrSpaceRow & {
  time_mode: 'duration' | 'window' | null
  duration_minutes: number | null
  start_time: string | Date | null
  end_time: string | Date | null
  form_template_id: string | null
}

export type CompanyCatalogRow =
  | (TagRow & { entity_kind: 'tags' })
  | (UnitRow & { entity_kind: 'units' })
  | (AttributeRow & { entity_kind: 'attributes' })
  | (ProductOrSpaceRow & { entity_kind: 'products' | 'spaces' })
  | (ServiceRow & { entity_kind: 'services' })

function parseJsonArray(value: string | unknown[] | null): unknown[] | undefined {
  if (value == null) return undefined
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

function formatTime(value: string | Date | null): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    // MySQL TIME may come as HH:mm:ss
    return value.slice(0, 5)
  }
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function payloadFromRow(kind: CatalogEntityKind, row: Record<string, unknown>): CatalogPayload | null {
  if (row.binding_mode === 'linked') {
    return null
  }

  const base = {
    name: typeof row.name === 'string' ? row.name : '',
    description: (row.description as string | null) ?? null,
    status: (row.status as 'verified' | 'pending' | undefined) ?? undefined,
  }

  switch (kind) {
    case 'tags':
      return {
        ...base,
        color: typeof row.color === 'string' ? row.color : '#2563EB',
      }
    case 'units':
      return {
        ...base,
        symbol: typeof row.symbol === 'string' ? row.symbol : '',
        isBase: Boolean(row.is_base),
        baseUnitId: (row.base_unit_id as string | null) ?? null,
      }
    case 'attributes':
      return {
        ...base,
        valueType: (row.value_type as 'number' | 'text') ?? 'text',
        unitId: (row.unit_id as string | null) ?? null,
      }
    case 'products':
    case 'spaces':
      return {
        ...base,
        tagIds: parseJsonArray(row.tag_ids as string | unknown[] | null) as string[] | undefined,
        attributes: parseJsonArray(row.attributes as string | unknown[] | null) as
          | {
              attributeId: string
              valueText?: string | null
              valueNumber?: number | null
            }[]
          | undefined,
      }
    case 'services':
      return {
        ...base,
        tagIds: parseJsonArray(row.tag_ids as string | unknown[] | null) as string[] | undefined,
        attributes: parseJsonArray(row.attributes as string | unknown[] | null) as
          | {
              attributeId: string
              valueText?: string | null
              valueNumber?: number | null
            }[]
          | undefined,
        timeMode: (row.time_mode as 'duration' | 'window') ?? 'duration',
        durationMinutes: (row.duration_minutes as number | null) ?? null,
        startTime: formatTime((row.start_time as string | Date | null) ?? null),
        endTime: formatTime((row.end_time as string | Date | null) ?? null),
      }
  }
}

function parseGalleryImages(
  value: string | unknown[] | null | undefined,
): { mediaId: string; url: string }[] | null {
  if (value == null) return null
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

export function mapCatalogRow(kind: CatalogEntityKind, row: Record<string, unknown>) {
  const base = {
    id: row.id as string,
    companyId: row.company_id as string,
    entityKind: kind,
    bindingMode: row.binding_mode as CatalogBindingMode,
    libraryEntityId: (row.library_entity_id as string | null) ?? null,
    payload: payloadFromRow(kind, row),
    /** Denormalized for list/search without reading payload */
    name: (row.name as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  }

  if (kind === 'products' || kind === 'services' || kind === 'spaces') {
    const withGallery = {
      ...base,
      galleryImages: parseGalleryImages(row.gallery_images as string | unknown[] | null),
    }
    if (kind === 'services') {
      return {
        ...withGallery,
        formTemplateId: (row.form_template_id as string | null) ?? null,
      }
    }
    return withGallery
  }

  return base
}

function columnsFromPayload(
  kind: CatalogEntityKind,
  bindingMode: CatalogBindingMode,
  libraryEntityId: string | null,
  payload: CatalogPayload | null,
): Record<string, unknown> {
  if (bindingMode === 'linked' || payload == null) {
    return {
      binding_mode: bindingMode,
      library_entity_id: libraryEntityId,
      name: null,
      description: null,
      status: null,
      ...(kind === 'tags' ? { color: null } : {}),
      ...(kind === 'units'
        ? { symbol: null, is_base: null, base_unit_id: null }
        : {}),
      ...(kind === 'attributes' ? { value_type: null, unit_id: null } : {}),
      ...(kind === 'products' || kind === 'spaces' || kind === 'services'
        ? { tag_ids: null, attributes: null }
        : {}),
      ...(kind === 'services'
        ? {
            time_mode: null,
            duration_minutes: null,
            start_time: null,
            end_time: null,
          }
        : {}),
    }
  }

  const p = payload as Record<string, unknown>
  const common = {
    binding_mode: bindingMode,
    library_entity_id: libraryEntityId,
    name: p.name ?? null,
    description: p.description ?? null,
    status: p.status ?? null,
  }

  switch (kind) {
    case 'tags':
      return { ...common, color: p.color ?? null }
    case 'units':
      return {
        ...common,
        symbol: p.symbol ?? null,
        is_base: p.isBase ?? false,
        base_unit_id: p.baseUnitId ?? null,
      }
    case 'attributes':
      return {
        ...common,
        value_type: p.valueType ?? null,
        unit_id: p.unitId ?? null,
      }
    case 'products':
    case 'spaces':
      return {
        ...common,
        tag_ids: p.tagIds != null ? JSON.stringify(p.tagIds) : null,
        attributes: p.attributes != null ? JSON.stringify(p.attributes) : null,
      }
    case 'services':
      return {
        ...common,
        tag_ids: p.tagIds != null ? JSON.stringify(p.tagIds) : null,
        attributes: p.attributes != null ? JSON.stringify(p.attributes) : null,
        time_mode: p.timeMode ?? null,
        duration_minutes: p.durationMinutes ?? null,
        start_time: p.startTime ?? null,
        end_time: p.endTime ?? null,
      }
  }
}

export async function listByCompanyAndKind(
  companyId: string,
  kind: CatalogEntityKind,
  options?: { q?: string },
): Promise<Record<string, unknown>[]> {
  const table = CATALOG_TABLE_BY_KIND[kind]
  const query = db(table).where({ company_id: companyId })
  const q = options?.q?.trim()
  if (q) {
    const pattern = `%${q}%`
    // Include linked rows (name null) so FE can filter after live hydrate.
    query.andWhere(function search() {
      this.where('name', 'like', pattern)
        .orWhere('description', 'like', pattern)
        .orWhere({ binding_mode: 'linked' })
    })
  }
  return query.orderBy('created_at', 'desc')
}

const CATALOG_COUNT_KINDS = ['products', 'services', 'spaces'] as const

export type CompanyCatalogCounts = Record<(typeof CATALOG_COUNT_KINDS)[number], number>

export async function countByCompanyForEntityKinds(
  companyId: string,
): Promise<CompanyCatalogCounts> {
  const counts: CompanyCatalogCounts = { products: 0, services: 0, spaces: 0 }
  await Promise.all(
    CATALOG_COUNT_KINDS.map(async (kind) => {
      const row = await db(CATALOG_TABLE_BY_KIND[kind])
        .where({ company_id: companyId })
        .count<{ count: string | number }>({ count: '*' })
        .first()
      counts[kind] = Number(row?.count ?? 0)
    }),
  )
  return counts
}

export async function findById(
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  return db(CATALOG_TABLE_BY_KIND[kind]).where({ id, company_id: companyId }).first()
}

export async function findByIds(
  companyId: string,
  kind: CatalogEntityKind,
  ids: string[],
): Promise<Record<string, unknown>[]> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return []
  return db(CATALOG_TABLE_BY_KIND[kind]).where({ company_id: companyId }).whereIn('id', unique)
}

export async function findByLibraryId(
  companyId: string,
  kind: CatalogEntityKind,
  libraryEntityId: string,
): Promise<Record<string, unknown> | undefined> {
  return db(CATALOG_TABLE_BY_KIND[kind])
    .where({
      company_id: companyId,
      library_entity_id: libraryEntityId,
    })
    .first()
}

export async function insertItem(input: {
  id: string
  companyId: string
  entityKind: CatalogEntityKind
  bindingMode: CatalogBindingMode
  libraryEntityId: string | null
  payload: CatalogPayload | null
}): Promise<Record<string, unknown>> {
  const now = new Date()
  const table = CATALOG_TABLE_BY_KIND[input.entityKind]
  await db(table).insert({
    id: input.id,
    company_id: input.companyId,
    ...columnsFromPayload(
      input.entityKind,
      input.bindingMode,
      input.libraryEntityId,
      input.payload,
    ),
    created_at: now,
    updated_at: now,
  })
  const row = await findById(input.companyId, input.entityKind, input.id)
  if (!row) {
    throw new Error('Failed to load catalog item after insert')
  }
  return row
}

export async function updateItem(
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
  patch: {
    bindingMode?: CatalogBindingMode
    libraryEntityId?: string | null
    payload?: CatalogPayload | null
  },
): Promise<Record<string, unknown> | undefined> {
  const existing = await findById(companyId, kind, id)
  if (!existing) return undefined

  const bindingMode = patch.bindingMode ?? (existing.binding_mode as CatalogBindingMode)
  const libraryEntityId =
    patch.libraryEntityId !== undefined
      ? patch.libraryEntityId
      : ((existing.library_entity_id as string | null) ?? null)
  const payload =
    patch.payload !== undefined ? patch.payload : payloadFromRow(kind, existing)

  await db(CATALOG_TABLE_BY_KIND[kind])
    .where({ id, company_id: companyId })
    .update({
      ...columnsFromPayload(kind, bindingMode, libraryEntityId, payload),
      updated_at: new Date(),
    })

  return findById(companyId, kind, id)
}

export async function updateGalleryImages(
  companyId: string,
  kind: Extract<CatalogEntityKind, 'products' | 'services' | 'spaces'>,
  id: string,
  galleryImages: { mediaId: string; url: string }[],
): Promise<Record<string, unknown> | undefined> {
  const existing = await findById(companyId, kind, id)
  if (!existing) return undefined

  await db(CATALOG_TABLE_BY_KIND[kind])
    .where({ id, company_id: companyId })
    .update({
      gallery_images: JSON.stringify(galleryImages),
      updated_at: new Date(),
    })

  return findById(companyId, kind, id)
}

/** Link / unlink a Design form template on a company service (any binding mode). */
export async function updateServiceFormTemplate(
  companyId: string,
  id: string,
  formTemplateId: string | null,
): Promise<Record<string, unknown> | undefined> {
  const existing = await findById(companyId, 'services', id)
  if (!existing) return undefined

  await db(CATALOG_TABLE_BY_KIND.services)
    .where({ id, company_id: companyId })
    .update({
      form_template_id: formTemplateId,
      updated_at: new Date(),
    })

  return findById(companyId, 'services', id)
}

/** Company services that have a linked Design form template. */
export async function listServicesWithForm(companyId: string): Promise<Record<string, unknown>[]> {
  return db(CATALOG_TABLE_BY_KIND.services)
    .where({ company_id: companyId })
    .whereNotNull('form_template_id')
    .orderBy('created_at', 'desc')
}

export async function deleteItem(
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
): Promise<number> {
  return db(CATALOG_TABLE_BY_KIND[kind]).where({ id, company_id: companyId }).delete()
}
