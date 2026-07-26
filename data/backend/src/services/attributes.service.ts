import { nanoid } from 'nanoid'
import { db, type AttributeRow, type DataRole } from '../models/db.js'
import type { CreateAttributeBody, UpdateAttributeBody } from '../schemas/attributes.schema.js'
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
import { countAttributeReferences } from '../utils/referenceCounts.js'

export interface AttributeDto {
  id: string
  name: string
  description: string | null
  valueType: string
  unitId: string | null
  status: string
  referenceCount: number
  createdAt: string
  updatedAt: string
}

async function rowToDto(row: AttributeRow): Promise<AttributeDto> {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    valueType: row.value_type,
    unitId: row.unit_id,
    status: row.status,
    referenceCount: await countAttributeReferences(row.id),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listAttributes(
  query: ListQueryInput & { value_type?: string; ids?: string | string[] },
) {
  const parsed = parseListQuery(query)
  const base = db<AttributeRow>('data_attributes')
  applyStatusFilter(base, parsed.status)
  applySearchFilter(base, parsed.q)
  const ids = parseIdsParam(query.ids)
  applyIdsFilter(base, ids)

  if (query.value_type === 'number' || query.value_type === 'text') {
    base.where({ value_type: query.value_type })
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

  return {
    items: await Promise.all(rows.map(rowToDto)),
    total,
    page,
    pageSize,
  }
}

export async function getAttributeById(id: string): Promise<AttributeDto | null> {
  const row = await db<AttributeRow>('data_attributes').where({ id }).first()
  return row ? rowToDto(row) : null
}

export async function createAttribute(
  body: CreateAttributeBody,
  role?: DataRole,
): Promise<AttributeDto> {
  await assertUniqueName('data_attributes', body.name)
  const id = nanoid()
  const now = db.fn.now(3)
  await db('data_attributes').insert({
    id,
    name: body.name,
    description: body.description ?? null,
    value_type: body.value_type,
    unit_id: body.value_type === 'number' ? (body.unit_id ?? null) : (body.unit_id ?? null),
    status: resolveCreateStatus(role, body.status),
    created_at: now,
    updated_at: now,
  })
  const created = await getAttributeById(id)
  if (!created) throw new Error('Failed to create attribute')
  return created
}

export async function updateAttribute(
  id: string,
  body: UpdateAttributeBody,
): Promise<AttributeDto> {
  const existing = await db<AttributeRow>('data_attributes').where({ id }).first()
  if (!existing) throw new Error('NOT_FOUND')
  if (body.name) await assertUniqueName('data_attributes', body.name, id)

  const valueType = body.value_type ?? existing.value_type
  await db('data_attributes')
    .where({ id })
    .update({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.value_type !== undefined ? { value_type: body.value_type } : {}),
      ...(body.unit_id !== undefined || body.value_type !== undefined
        ? { unit_id: valueType === 'number' ? (body.unit_id ?? existing.unit_id) : null }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      updated_at: db.fn.now(3),
    })

  const updated = await getAttributeById(id)
  if (!updated) throw new Error('NOT_FOUND')
  return updated
}

export async function deleteAttribute(id: string): Promise<void> {
  const refs = await countAttributeReferences(id)
  if (refs > 0) throw new Error('FK_CONSTRAINT')
  const deleted = await db('data_attributes').where({ id }).delete()
  if (!deleted) throw new Error('NOT_FOUND')
}
