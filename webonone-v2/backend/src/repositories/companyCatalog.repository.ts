import { nanoid } from 'nanoid'
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
  list_price: string | number | null
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

export const CATALOG_PRICED_KINDS = ['products', 'services', 'spaces'] as const
export type CatalogPricedKind = (typeof CATALOG_PRICED_KINDS)[number]

export function isCatalogPricedKind(kind: CatalogEntityKind): kind is CatalogPricedKind {
  return (CATALOG_PRICED_KINDS as readonly string[]).includes(kind)
}

export function parseMoney(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function extractListPrice(payload: CatalogPayload | null): number | null | undefined {
  if (!payload || typeof payload !== 'object' || !('listPrice' in payload)) return undefined
  const raw = (payload as { listPrice?: unknown }).listPrice
  if (raw == null || raw === '') return null
  return parseMoney(raw)
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
        listPrice: parseMoney(row.list_price),
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
        listPrice: parseMoney(row.list_price),
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
      listPrice: parseMoney(row.list_price),
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
  const listPrice = isCatalogPricedKind(input.entityKind)
    ? (extractListPrice(input.payload) ?? null)
    : undefined
  await db(table).insert({
    id: input.id,
    company_id: input.companyId,
    ...columnsFromPayload(
      input.entityKind,
      input.bindingMode,
      input.libraryEntityId,
      input.payload,
    ),
    ...(listPrice !== undefined ? { list_price: listPrice } : {}),
    created_at: now,
    updated_at: now,
  })
  const row = await findById(input.companyId, input.entityKind, input.id)
  if (!row) {
    throw new Error('Failed to load catalog item after insert')
  }
  if (input.entityKind === 'services') {
    await insertDefaultCheckInWorkflowItem(input.companyId, input.id)
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

  const listPrice = isCatalogPricedKind(kind) ? extractListPrice(payload) : undefined

  await db(CATALOG_TABLE_BY_KIND[kind])
    .where({ id, company_id: companyId })
    .update({
      ...columnsFromPayload(kind, bindingMode, libraryEntityId, payload),
      ...(listPrice !== undefined ? { list_price: listPrice } : {}),
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

/** Company-owned list price — independent of binding mode (including linked). */
export async function updateListPrice(
  companyId: string,
  kind: CatalogPricedKind,
  id: string,
  listPrice: number | null,
): Promise<Record<string, unknown> | undefined> {
  const existing = await findById(companyId, kind, id)
  if (!existing) return undefined

  await db(CATALOG_TABLE_BY_KIND[kind])
    .where({ id, company_id: companyId })
    .update({
      list_price: listPrice,
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

export type WorkflowItemKind = 'check_in' | 'space'

export type WorkflowItemRow = {
  id: string
  company_id: string
  service_id: string
  space_id: string | null
  kind: WorkflowItemKind
  sort_order: number
  session_queue: boolean | number
}

export async function insertDefaultCheckInWorkflowItem(
  companyId: string,
  serviceId: string,
): Promise<void> {
  const existing = await db('company_service_workflow_items')
    .where({ company_id: companyId, service_id: serviceId, kind: 'check_in' })
    .first()
  if (existing) return
  await db('company_service_workflow_items').insert({
    id: nanoid(),
    company_id: companyId,
    service_id: serviceId,
    space_id: null,
    kind: 'check_in',
    sort_order: 1,
    session_queue: false,
  })
}

export async function listWorkflowItems(
  companyId: string,
  serviceId: string,
): Promise<WorkflowItemRow[]> {
  return db('company_service_workflow_items')
    .where({ company_id: companyId, service_id: serviceId })
    .orderBy('sort_order', 'asc')
}

export async function listWorkflowStaffByItemIds(
  itemIds: string[],
): Promise<{ item_id: string; staff_id: string; display_name: string }[]> {
  if (itemIds.length === 0) return []
  return db('company_service_workflow_staff as link')
    .join('company_staff as staff', 'staff.id', 'link.staff_id')
    .whereIn('link.item_id', itemIds)
    .select('link.item_id', 'link.staff_id', 'staff.display_name')
}

export async function listWorkflowFormsByItemIds(
  itemIds: string[],
): Promise<{ item_id: string; form_template_id: string }[]> {
  if (itemIds.length === 0) return []
  return db('company_service_workflow_forms')
    .whereIn('item_id', itemIds)
    .select('item_id', 'form_template_id')
}

export async function replaceWorkflowItems(
  companyId: string,
  serviceId: string,
  items: {
    id: string
    kind: WorkflowItemKind
    space_id: string | null
    staff_ids: string[]
    form_ids: string[]
    session_queue: boolean
  }[],
): Promise<void> {
  await db.transaction(async (trx) => {
    await trx('company_service_workflow_items')
      .where({ company_id: companyId, service_id: serviceId })
      .delete()
    if (items.length === 0) {
      await trx('company_services')
        .where({ id: serviceId, company_id: companyId })
        .update({ updated_at: trx.fn.now(3) })
      return
    }
    await trx('company_service_workflow_items').insert(
      items.map((item, index) => ({
        id: item.id,
        company_id: companyId,
        service_id: serviceId,
        space_id: item.space_id,
        kind: item.kind,
        sort_order: index + 1,
        session_queue: item.session_queue ? 1 : 0,
      })),
    )
    const staffRows = items.flatMap((item) =>
      [...new Set(item.staff_ids)].map((staff_id) => ({ item_id: item.id, staff_id })),
    )
    if (staffRows.length > 0) {
      await trx('company_service_workflow_staff').insert(staffRows)
    }
    const formRows = items.flatMap((item) =>
      [...new Set(item.form_ids)].map((form_template_id) => ({
        item_id: item.id,
        form_template_id,
      })),
    )
    if (formRows.length > 0) {
      await trx('company_service_workflow_forms').insert(formRows)
    }
    await trx('company_services')
      .where({ id: serviceId, company_id: companyId })
      .update({ updated_at: trx.fn.now(3) })
  })
}
