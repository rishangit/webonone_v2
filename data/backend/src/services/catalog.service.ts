import { nanoid } from 'nanoid'
import { db, type CatalogRow, type DataRole, type ServiceRow, type ServiceTimeMode } from '../models/db.js'
import type { CreateCatalogBody, UpdateCatalogBody } from '../schemas/catalog.schema.js'
import type { CreateServiceBody, UpdateServiceBody } from '../schemas/services.schema.js'
import { resolveCreateStatus } from '../utils/createStatus.js'
import {
  applyIdsFilter,
  applySearchFilter,
  applyStatusFilter,
  assertUniqueName,
  parseIdsParam,
  parseListQuery,
  type ListQueryInput,
} from '../utils/listQuery.js'

export type CatalogKind = 'products' | 'services' | 'spaces'

const TABLE_MAP: Record<
  CatalogKind,
  { main: string; tags: string; attributes: string; idCol: string }
> = {
  products: {
    main: 'data_products',
    tags: 'data_product_tags',
    attributes: 'data_product_attributes',
    idCol: 'product_id',
  },
  services: {
    main: 'data_services',
    tags: 'data_service_tags',
    attributes: 'data_service_attributes',
    idCol: 'service_id',
  },
  spaces: {
    main: 'data_spaces',
    tags: 'data_space_tags',
    attributes: 'data_space_attributes',
    idCol: 'space_id',
  },
}

export interface TagSummary {
  id: string
  name: string
  color: string
}

export interface CatalogAttributeValue {
  attributeId: string
  name: string
  valueText: string | null
  valueNumber: number | null
}

export interface CatalogDto {
  id: string
  name: string
  description: string | null
  status: string
  referenceCount: number
  tags: TagSummary[]
  attributes: CatalogAttributeValue[]
  createdAt: string
  updatedAt: string
  timeMode?: ServiceTimeMode
  durationMinutes?: number | null
  startTime?: string | null
  endTime?: string | null
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

async function loadTagsForEntity(
  kind: CatalogKind,
  entityId: string,
): Promise<TagSummary[]> {
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
): Promise<CatalogAttributeValue[]> {
  const { attributes, idCol } = TABLE_MAP[kind]
  const rows = await db(attributes).where({ [idCol]: entityId })
  const result: CatalogAttributeValue[] = []
  for (const row of rows) {
    const attr = await db('data_attributes').where({ id: row.attribute_id }).first()
    if (!attr) continue
    result.push({
      attributeId: row.attribute_id,
      name: attr.name,
      valueText: row.value_text ?? null,
      valueNumber: row.value_number != null ? Number(row.value_number) : null,
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

export function createCatalogService(kind: CatalogKind) {
  const { main } = TABLE_MAP[kind]

  return {
    async list(query: ListQueryInput & { tag_id?: string | string[]; ids?: string | string[] }) {
      const parsed = parseListQuery(query)
      const base = db<CatalogRow>(main)
      applyStatusFilter(base, parsed.status)
      applySearchFilter(base, parsed.q)
      const ids = parseIdsParam(query.ids)
      applyIdsFilter(base, ids)

      const tagIds = query.tag_id
        ? Array.isArray(query.tag_id)
          ? query.tag_id
          : [query.tag_id]
        : []
      if (tagIds.length > 0) {
        const { tags, idCol } = TABLE_MAP[kind]
        base.whereIn('id', function filterByTags() {
          this.select(idCol).from(tags).whereIn('tag_id', tagIds)
        })
      }

      const countResult = await base.clone().count<{ count: number }[]>('* as count')
      const total = Number(countResult[0]?.count ?? 0)

      const pageSize = ids.length > 0 ? Math.min(100, Math.max(parsed.pageSize, ids.length)) : parsed.pageSize
      const page = ids.length > 0 ? 1 : parsed.page

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

        const { tags, attributes, idCol } = TABLE_MAP[kind]
        if (body.tag_ids?.length) {
          await trx(tags).insert(body.tag_ids.map((tag_id) => ({ [idCol]: id, tag_id })))
        }
        if (body.attributes?.length) {
          await trx(attributes).insert(
            body.attributes.map((av) => ({
              [idCol]: id,
              attribute_id: av.attribute_id,
              value_text: av.value_text ?? null,
              value_number: av.value_number ?? null,
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

        const { tags, attributes, idCol } = TABLE_MAP[kind]
        if (body.tag_ids !== undefined) {
          await trx(tags).where({ [idCol]: id }).delete()
          if (body.tag_ids.length > 0) {
            await trx(tags).insert(body.tag_ids.map((tag_id) => ({ [idCol]: id, tag_id })))
          }
        }
        if (body.attributes !== undefined) {
          await trx(attributes).where({ [idCol]: id }).delete()
          if (body.attributes.length > 0) {
            await trx(attributes).insert(
              body.attributes.map((av) => ({
                [idCol]: id,
                attribute_id: av.attribute_id,
                value_text: av.value_text ?? null,
                value_number: av.value_number ?? null,
              })),
            )
          }
        }
      })

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
