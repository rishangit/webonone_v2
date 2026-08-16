import { nanoid } from 'nanoid'
import { db, type AttributeRow, type DataRole, type UnitRow } from '../models/db.js'
import type { CreateAttributeBody, UpdateAttributeBody } from '../schemas/attributes.schema.js'
import { resolveCreateStatus } from '../utils/createStatus.js'
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
import { countAttributeReferences } from '../utils/referenceCounts.js'

export interface AttributeUnitSummary {
  id: string
  name: string
  symbol: string
}

export interface AttributeDto {
  id: string
  name: string
  description: string | null
  valueType: string
  unitId: string | null
  unit: AttributeUnitSummary | null
  status: string
  referenceCount: number
  createdAt: string
  updatedAt: string
}

async function loadUnitsByIds(unitIds: string[]): Promise<Map<string, AttributeUnitSummary>> {
  const uniqueIds = [...new Set(unitIds.filter(Boolean))]
  const map = new Map<string, AttributeUnitSummary>()
  if (uniqueIds.length === 0) return map

  const rows = await db<UnitRow>('data_units').whereIn('id', uniqueIds)
  for (const row of rows) {
    map.set(row.id, { id: row.id, name: row.name, symbol: row.symbol })
  }
  return map
}

async function rowToDto(
  row: AttributeRow,
  unitsById?: Map<string, AttributeUnitSummary>,
): Promise<AttributeDto> {
  let unit: AttributeUnitSummary | null = null
  if (row.unit_id) {
    unit = unitsById?.get(row.unit_id) ?? null
    if (!unit) {
      const unitRow = await db<UnitRow>('data_units').where({ id: row.unit_id }).first()
      if (unitRow) {
        unit = { id: unitRow.id, name: unitRow.name, symbol: unitRow.symbol }
      }
    }
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    valueType: row.value_type,
    unitId: row.unit_id,
    unit,
    status: row.status,
    referenceCount: await countAttributeReferences(row.id),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listAttributes(
  query: ListQueryInput & { value_type?: string; ids?: string | string[]; names?: string | string[] },
) {
  const parsed = parseListQuery(query)
  const base = db<AttributeRow>('data_attributes')
  applyStatusFilter(base, parsed.status)
  applySearchFilter(base, parsed.q)
  const ids = parseIdsParam(query.ids)
  const names = parseNamesParam(query.names)
  applyIdsFilter(base, ids)
  applyNamesFilter(base, names)

  if (query.value_type === 'number' || query.value_type === 'text') {
    base.where({ value_type: query.value_type })
  }

  const countResult = await base.clone().count<{ count: number }[]>('* as count')
  const total = Number(countResult[0]?.count ?? 0)

  const { pageSize, page } = bulkListPaging(parsed, ids, names)

  const rows = await base
    .clone()
    .orderBy(parsed.sortField, parsed.sortDir)
    .offset((page - 1) * pageSize)
    .limit(pageSize)

  const unitsById = await loadUnitsByIds(
    rows.map((row) => row.unit_id).filter((id): id is string => Boolean(id)),
  )

  return {
    items: await Promise.all(rows.map((row) => rowToDto(row, unitsById))),
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
    unit_id: body.unit_id ?? null,
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

  await db('data_attributes')
    .where({ id })
    .update({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.value_type !== undefined ? { value_type: body.value_type } : {}),
      ...(body.unit_id !== undefined ? { unit_id: body.unit_id } : {}),
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
