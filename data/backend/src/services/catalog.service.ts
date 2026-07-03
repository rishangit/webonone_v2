import { nanoid } from 'nanoid'
import { db, type CatalogRow } from '../models/db.js'
import type { CreateCatalogBody, UpdateCatalogBody } from '../schemas/catalog.schema.js'
import { getTagById } from './tags.service.js'
import {
  applySearchFilter,
  applyStatusFilter,
  assertUniqueName,
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
  tags: TagSummary[]
  attributes: CatalogAttributeValue[]
  createdAt: string
  updatedAt: string
}

async function loadTagsForEntity(
  kind: CatalogKind,
  entityId: string,
): Promise<TagSummary[]> {
  const { tags, idCol } = TABLE_MAP[kind]
  const links = await db(tags).where({ [idCol]: entityId }).select('tag_id')
  const summaries: TagSummary[] = []
  for (const link of links) {
    const tag = await getTagById(link.tag_id as string)
    if (tag) {
      summaries.push({ id: tag.id, name: tag.name, color: tag.color })
    }
  }
  return summaries
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

async function rowToDto(kind: CatalogKind, row: CatalogRow): Promise<CatalogDto> {
  const [tags, attributes] = await Promise.all([
    loadTagsForEntity(kind, row.id),
    loadAttributesForEntity(kind, row.id),
  ])
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    tags,
    attributes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export function createCatalogService(kind: CatalogKind) {
  const { main } = TABLE_MAP[kind]

  return {
    async list(query: ListQueryInput & { tag_id?: string | string[] }) {
      const parsed = parseListQuery(query)
      const base = db<CatalogRow>(main)
      applyStatusFilter(base, parsed.status)
      applySearchFilter(base, parsed.q)

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

      const rows = await base
        .clone()
        .orderBy(parsed.sortField, parsed.sortDir)
        .offset((parsed.page - 1) * parsed.pageSize)
        .limit(parsed.pageSize)

      const items = await Promise.all(rows.map((row) => rowToDto(kind, row)))

      return { items, total, page: parsed.page, pageSize: parsed.pageSize }
    },

    async getById(id: string): Promise<CatalogDto | null> {
      const row = await db<CatalogRow>(main).where({ id }).first()
      return row ? rowToDto(kind, row) : null
    },

    async create(body: CreateCatalogBody): Promise<CatalogDto> {
      await assertUniqueName(main, body.name)
      const id = nanoid()
      const now = db.fn.now(3)

      await db.transaction(async (trx) => {
        await trx(main).insert({
          id,
          name: body.name,
          description: body.description ?? null,
          status: body.status ?? 'pending',
          created_at: now,
          updated_at: now,
        })

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

    async update(id: string, body: UpdateCatalogBody): Promise<CatalogDto> {
      const existing = await db<CatalogRow>(main).where({ id }).first()
      if (!existing) throw new Error('NOT_FOUND')
      if (body.name) await assertUniqueName(main, body.name, id)

      await db.transaction(async (trx) => {
        await trx(main)
          .where({ id })
          .update({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
            updated_at: trx.fn.now(3),
          })

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
