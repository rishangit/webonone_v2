import { nanoid } from 'nanoid'
import { db, type CatalogRow, type DataRole, type ServiceRow, type ServiceTimeMode } from '../models/db.js'
import type {
  CatalogAttributeValueBody,
  CatalogGalleryImage,
  CreateCatalogBody,
  ReplaceCatalogAttributesBody,
  UpdateCatalogBody,
} from '../schemas/catalog.schema.js'
import type { CreateServiceBody, UpdateServiceBody } from '../schemas/services.schema.js'
import { resolveCreateStatus } from '../utils/createStatus.js'
import { rewriteMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'
import {
  applyIdsFilter,
  applyNamesFilter,
  applySearchFilter,
  applyStatusFilter,
  assertUniqueName,
  bulkListPaging,
  parseIdsParam,
  parseNamesParam,
  parseListQuery,
  type ListQueryInput,
} from '../utils/listQuery.js'

export type CatalogKind = 'products' | 'services' | 'spaces'

const TABLE_MAP: Record<
  CatalogKind,
  {
    main: string
    tags: string
    attributes: string
    attributeValues: string
    idCol: string
  }
> = {
  products: {
    main: 'data_products',
    tags: 'data_product_tags',
    attributes: 'data_product_attributes',
    attributeValues: 'data_product_attribute_values',
    idCol: 'product_id',
  },
  services: {
    main: 'data_services',
    tags: 'data_service_tags',
    attributes: 'data_service_attributes',
    attributeValues: 'data_service_attribute_values',
    idCol: 'service_id',
  },
  spaces: {
    main: 'data_spaces',
    tags: 'data_space_tags',
    attributes: 'data_space_attributes',
    attributeValues: 'data_space_attribute_values',
    idCol: 'space_id',
  },
}

export interface TagSummary {
  id: string
  name: string
  color: string
}

export interface AttributeUnitSummary {
  id: string
  name: string
  symbol: string
}

export interface CatalogAttributeValueEntry {
  id: string
  valueText: string | null
  valueNumber: number | null
  isDefault: boolean
}

export interface CatalogAttributeLink {
  attributeId: string
  name: string
  valueType: 'number' | 'text'
  unit: AttributeUnitSummary | null
  values: CatalogAttributeValueEntry[]
}

export interface CatalogDto {
  id: string
  name: string
  description: string | null
  status: string
  referenceCount: number
  tags: TagSummary[]
  attributes: CatalogAttributeLink[]
  galleryImages: CatalogGalleryImage[]
  createdAt: string
  updatedAt: string
  timeMode?: ServiceTimeMode
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
}

function parseGalleryImages(
  value: string | CatalogGalleryImage[] | null | undefined,
): CatalogGalleryImage[] {
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
      (item): item is CatalogGalleryImage =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as { mediaId?: unknown }).mediaId === 'string' &&
        typeof (item as { url?: unknown }).url === 'string',
    )
    .map((item) => ({ ...item, url: rewriteMediaFileUrl(item.url) }))
}

type CatalogWriteBody = CreateCatalogBody | CreateServiceBody | UpdateCatalogBody | UpdateServiceBody

function toHhMm(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 5)
  const hours = String(value.getUTCHours()).padStart(2, '0')
  const minutes = String(value.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function serviceTimeColumns(body: CatalogWriteBody): {
  time_mode: ServiceTimeMode
  duration_minutes: number | null
  start_time: string | null
  end_time: string | null
} | null {
  if (!('time_mode' in body) || body.time_mode == null) return null
  if (body.time_mode === 'duration') {
    return {
      time_mode: 'duration',
      duration_minutes: body.duration_minutes ?? null,
      start_time: null,
      end_time: null,
    }
  }
  return {
    time_mode: 'window',
    duration_minutes: null,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
  }
}

async function loadTagsForEntity(kind: CatalogKind, entityId: string): Promise<TagSummary[]> {
  const { tags, idCol } = TABLE_MAP[kind]
  const links = await db(tags).where({ [idCol]: entityId }).select('tag_id')
  if (links.length === 0) return []
  const tagIds = links.map((link) => link.tag_id as string)
  const rows = await db('data_tags').whereIn('id', tagIds).select('id', 'name', 'color')
  return rows.map((tag) => ({
    id: tag.id as string,
    name: tag.name as string,
    color: tag.color as string,
  }))
}

async function loadAttributesForEntity(
  kind: CatalogKind,
  entityId: string,
): Promise<CatalogAttributeLink[]> {
  const { attributes, attributeValues, idCol } = TABLE_MAP[kind]
  const links = await db(attributes).where({ [idCol]: entityId })
  if (links.length === 0) return []

  const attributeIds = links.map((link) => link.attribute_id as string)
  const attrRows = await db('data_attributes').whereIn('id', attributeIds)
  const attrById = new Map(attrRows.map((row) => [row.id as string, row]))

  const unitIds = [
    ...new Set(
      attrRows
        .map((row) => row.unit_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const unitRows =
    unitIds.length > 0 ? await db('data_units').whereIn('id', unitIds) : []
  const unitById = new Map(
    unitRows.map((row) => [
      row.id as string,
      {
        id: row.id as string,
        name: row.name as string,
        symbol: row.symbol as string,
      },
    ]),
  )

  const valueRows = await db(attributeValues)
    .where({ [idCol]: entityId })
    .whereIn('attribute_id', attributeIds)
    .orderBy('created_at', 'asc')

  const valuesByAttribute = new Map<string, CatalogAttributeValueEntry[]>()
  for (const row of valueRows) {
    const attributeId = row.attribute_id as string
    const list = valuesByAttribute.get(attributeId) ?? []
    list.push({
      id: row.id as string,
      valueText: (row.value_text as string | null) ?? null,
      valueNumber: row.value_number != null ? Number(row.value_number) : null,
      isDefault: Boolean(row.is_default),
    })
    valuesByAttribute.set(attributeId, list)
  }

  const result: CatalogAttributeLink[] = []
  for (const link of links) {
    const attributeId = link.attribute_id as string
    const attr = attrById.get(attributeId)
    if (!attr) continue
    const unitId = attr.unit_id as string | null
    result.push({
      attributeId,
      name: attr.name as string,
      valueType: attr.value_type === 'number' ? 'number' : 'text',
      unit: unitId ? (unitById.get(unitId) ?? null) : null,
      values: valuesByAttribute.get(attributeId) ?? [],
    })
  }
  return result
}

async function rowToDto(kind: CatalogKind, row: CatalogRow | ServiceRow): Promise<CatalogDto> {
  const [tags, attributes] = await Promise.all([
    loadTagsForEntity(kind, row.id),
    loadAttributesForEntity(kind, row.id),
  ])
  const dto: CatalogDto = {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    referenceCount: 0,
    tags,
    attributes,
    galleryImages: parseGalleryImages(row.gallery_images),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
  if (kind === 'services') {
    const service = row as ServiceRow
    dto.timeMode = service.time_mode
    dto.durationMinutes = service.duration_minutes
    dto.startTime = toHhMm(service.start_time)
    dto.endTime = toHhMm(service.end_time)
  }
  return dto
}

function assertValueMatchesType(
  valueType: 'number' | 'text',
  body: CatalogAttributeValueBody,
): void {
  const hasText = body.value_text != null && body.value_text !== ''
  const hasNumber = body.value_number != null
  if (valueType === 'number' && !hasNumber) {
    throw new Error('VALIDATION: Number attributes require value_number')
  }
  if (valueType === 'text' && !hasText) {
    throw new Error('VALIDATION: Text attributes require value_text')
  }
}

/** Ensure each attribute has exactly one default when values exist (single value always default). */
async function ensureAttributeDefault(
  attributeValues: string,
  idCol: string,
  entityId: string,
  attributeId: string,
): Promise<void> {
  const rows = await db(attributeValues)
    .where({ [idCol]: entityId, attribute_id: attributeId })
    .orderBy('created_at', 'asc')
    .select('id', 'is_default')

  if (rows.length === 0) return

  if (rows.length === 1) {
    if (!rows[0].is_default) {
      await db(attributeValues).where({ id: rows[0].id }).update({ is_default: true })
    }
    return
  }

  const defaults = rows.filter((row) => row.is_default)
  if (defaults.length === 1) return

  await db(attributeValues)
    .where({ [idCol]: entityId, attribute_id: attributeId })
    .update({ is_default: false })
  await db(attributeValues).where({ id: rows[0].id }).update({ is_default: true })
}

export function createCatalogService(kind: CatalogKind) {
  const { main, attributes, attributeValues, idCol } = TABLE_MAP[kind]

  return {
    async list(
      query: ListQueryInput & { tag_id?: string | string[]; ids?: string | string[]; names?: string | string[] },
    ) {
      const parsed = parseListQuery(query)
      const base = db<CatalogRow>(main)
      applyStatusFilter(base, parsed.status)
      applySearchFilter(base, parsed.q)
      const ids = parseIdsParam(query.ids)
      const names = parseNamesParam(query.names)
      applyIdsFilter(base, ids)
      applyNamesFilter(base, names)

      const tagIds = query.tag_id
        ? Array.isArray(query.tag_id)
          ? query.tag_id
          : [query.tag_id]
        : []
      if (tagIds.length > 0) {
        const { tags } = TABLE_MAP[kind]
        base.whereIn('id', function filterByTags() {
          this.select(idCol).from(tags).whereIn('tag_id', tagIds)
        })
      }

      const countResult = await base.clone().count<{ count: number }[]>('* as count')
      const total = Number(countResult[0]?.count ?? 0)

      const { pageSize, page } = bulkListPaging(parsed, ids, names)

      const rows = await base
        .clone()
        .orderBy(parsed.sortField, parsed.sortDir)
        .offset((page - 1) * pageSize)
        .limit(pageSize)

      const items = await Promise.all(rows.map((row) => rowToDto(kind, row)))

      return { items, total, page, pageSize }
    },

    async getById(id: string): Promise<CatalogDto | null> {
      const row = await db<CatalogRow>(main).where({ id }).first()
      return row ? rowToDto(kind, row) : null
    },

    async create(body: CatalogWriteBody, role?: DataRole): Promise<CatalogDto> {
      await assertUniqueName(main, body.name!)
      const id = nanoid()
      const now = db.fn.now(3)

      await db.transaction(async (trx) => {
        const insert: Record<string, unknown> = {
          id,
          name: body.name,
          description: body.description ?? null,
          status: resolveCreateStatus(role, body.status),
          created_at: now,
          updated_at: now,
        }
        if (kind === 'services') {
          const timeCols = serviceTimeColumns(body)
          if (timeCols) Object.assign(insert, timeCols)
        }

        await trx(main).insert(insert)

        const { tags } = TABLE_MAP[kind]
        if (body.tag_ids?.length) {
          await trx(tags).insert(body.tag_ids.map((tag_id) => ({ [idCol]: id, tag_id })))
        }
        if (body.attributes?.length) {
          const uniqueIds = [...new Set(body.attributes.map((av) => av.attribute_id))]
          await trx(attributes).insert(
            uniqueIds.map((attribute_id) => ({
              [idCol]: id,
              attribute_id,
            })),
          )
        }
      })

      const created = await this.getById(id)
      if (!created) throw new Error('Failed to create catalog item')
      return created
    },

    async update(id: string, body: CatalogWriteBody): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')
      if (body.name) await assertUniqueName(main, body.name, id)

      await db.transaction(async (trx) => {
        const patch: Record<string, unknown> = {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          updated_at: trx.fn.now(3),
        }
        if (kind === 'services') {
          const timeCols = serviceTimeColumns(body)
          if (timeCols) Object.assign(patch, timeCols)
        }

        await trx(main).where({ id }).update(patch)

        const { tags } = TABLE_MAP[kind]
        if (body.tag_ids !== undefined) {
          await trx(tags).where({ [idCol]: id }).delete()
          if (body.tag_ids.length > 0) {
            await trx(tags).insert(body.tag_ids.map((tag_id) => ({ [idCol]: id, tag_id })))
          }
        }
        if (body.attributes !== undefined) {
          await trx(attributeValues).where({ [idCol]: id }).delete()
          await trx(attributes).where({ [idCol]: id }).delete()
          if (body.attributes.length > 0) {
            const uniqueIds = [...new Set(body.attributes.map((av) => av.attribute_id))]
            await trx(attributes).insert(
              uniqueIds.map((attribute_id) => ({
                [idCol]: id,
                attribute_id,
              })),
            )
          }
        }
      })

      const updated = await this.getById(id)
      if (!updated) throw new Error('NOT_FOUND')
      return updated
    },

    async updateGallery(id: string, galleryImages: CatalogGalleryImage[]): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')

      await db(main)
        .where({ id })
        .update({
          gallery_images: JSON.stringify(galleryImages),
          updated_at: db.fn.now(3),
        })

      const updated = await this.getById(id)
      if (!updated) throw new Error('NOT_FOUND')
      return updated
    },

    async replaceAttributes(
      id: string,
      body: ReplaceCatalogAttributesBody,
    ): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')

      const nextIds = [...new Set(body.attribute_ids)]
      if (nextIds.length > 0) {
        const found = await db('data_attributes').whereIn('id', nextIds).select('id')
        if (found.length !== nextIds.length) throw new Error('NOT_FOUND')
      }

      await db.transaction(async (trx) => {
        const currentLinks = await trx(attributes).where({ [idCol]: id }).select('attribute_id')
        const currentIds = new Set(currentLinks.map((row) => row.attribute_id as string))
        const nextSet = new Set(nextIds)

        const removed = [...currentIds].filter((attributeId) => !nextSet.has(attributeId))
        if (removed.length > 0) {
          await trx(attributeValues)
            .where({ [idCol]: id })
            .whereIn('attribute_id', removed)
            .delete()
          await trx(attributes)
            .where({ [idCol]: id })
            .whereIn('attribute_id', removed)
            .delete()
        }

        const added = nextIds.filter((attributeId) => !currentIds.has(attributeId))
        if (added.length > 0) {
          await trx(attributes).insert(
            added.map((attribute_id) => ({
              [idCol]: id,
              attribute_id,
            })),
          )
        }

        await trx(main).where({ id }).update({ updated_at: trx.fn.now(3) })
      })

      const updated = await this.getById(id)
      if (!updated) throw new Error('NOT_FOUND')
      return updated
    },

    async addAttributeValue(
      id: string,
      attributeId: string,
      body: CatalogAttributeValueBody,
    ): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')

      const link = await db(attributes)
        .where({ [idCol]: id, attribute_id: attributeId })
        .first()
      if (!link) throw new Error('NOT_FOUND')

      const attr = await db('data_attributes').where({ id: attributeId }).first()
      if (!attr) throw new Error('NOT_FOUND')
      const valueType = attr.value_type === 'number' ? 'number' : 'text'
      assertValueMatchesType(valueType, body)

      const existingCount = Number(
        (
          await db(attributeValues)
            .where({ [idCol]: id, attribute_id: attributeId })
            .count({ count: '*' })
            .first()
        )?.count ?? 0,
      )
      const isDefault = existingCount === 0

      const now = db.fn.now(3)
      await db(attributeValues).insert({
        id: nanoid(),
        [idCol]: id,
        attribute_id: attributeId,
        value_text: valueType === 'text' ? body.value_text : null,
        value_number: valueType === 'number' ? body.value_number : null,
        is_default: isDefault,
        created_at: now,
        updated_at: now,
      })
      await db(main).where({ id }).update({ updated_at: now })

      const updated = await this.getById(id)
      if (!updated) throw new Error('NOT_FOUND')
      return updated
    },

    async updateAttributeValue(
      id: string,
      valueId: string,
      body: CatalogAttributeValueBody,
    ): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')

      const valueRow = await db(attributeValues)
        .where({ id: valueId, [idCol]: id })
        .first()
      if (!valueRow) throw new Error('NOT_FOUND')

      const attr = await db('data_attributes')
        .where({ id: valueRow.attribute_id })
        .first()
      if (!attr) throw new Error('NOT_FOUND')
      const valueType = attr.value_type === 'number' ? 'number' : 'text'
      assertValueMatchesType(valueType, body)

      const now = db.fn.now(3)
      await db(attributeValues)
        .where({ id: valueId })
        .update({
          value_text: valueType === 'text' ? body.value_text : null,
          value_number: valueType === 'number' ? body.value_number : null,
          updated_at: now,
        })
      await db(main).where({ id }).update({ updated_at: now })

      const updated = await this.getById(id)
      if (!updated) throw new Error('NOT_FOUND')
      return updated
    },

    async setAttributeValueDefault(id: string, valueId: string): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')

      const valueRow = await db(attributeValues)
        .where({ id: valueId, [idCol]: id })
        .first()
      if (!valueRow) throw new Error('NOT_FOUND')

      const attributeId = valueRow.attribute_id as string
      const now = db.fn.now(3)

      await db.transaction(async (trx) => {
        await trx(attributeValues)
          .where({ [idCol]: id, attribute_id: attributeId })
          .update({ is_default: false, updated_at: now })
        await trx(attributeValues)
          .where({ id: valueId })
          .update({ is_default: true, updated_at: now })
        await trx(main).where({ id }).update({ updated_at: now })
      })

      const updated = await this.getById(id)
      if (!updated) throw new Error('NOT_FOUND')
      return updated
    },

    async deleteAttributeValue(id: string, valueId: string): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')

      const valueRow = await db(attributeValues)
        .where({ id: valueId, [idCol]: id })
        .first()
      if (!valueRow) throw new Error('NOT_FOUND')

      const attributeId = valueRow.attribute_id as string
      const deleted = await db(attributeValues)
        .where({ id: valueId, [idCol]: id })
        .delete()
      if (!deleted) throw new Error('NOT_FOUND')

      await ensureAttributeDefault(attributeValues, idCol, id, attributeId)
      await db(main).where({ id }).update({ updated_at: db.fn.now(3) })

      const updated = await this.getById(id)
      if (!updated) throw new Error('NOT_FOUND')
      return updated
    },

    async delete(id: string): Promise<void> {
      const deleted = await db(main).where({ id }).delete()
      if (!deleted) throw new Error('NOT_FOUND')
    },
  }
}

export const productsService = createCatalogService('products')
export const servicesService = createCatalogService('services')
export const spacesService = createCatalogService('spaces')
