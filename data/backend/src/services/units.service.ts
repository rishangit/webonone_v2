import { nanoid } from 'nanoid'
import { db, type DataRole, type UnitRow } from '../models/db.js'
import type { CreateUnitBody, UpdateUnitBody } from '../schemas/units.schema.js'
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
import { countUnitReferences } from '../utils/referenceCounts.js'

export interface UnitDto {
  id: string
  name: string
  description: string | null
  symbol: string
  baseUnitId: string | null
  isBase: boolean
  status: string
  referenceCount: number
  createdAt: string
  updatedAt: string
}

async function rowToDto(row: UnitRow): Promise<UnitDto> {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    symbol: row.symbol,
    baseUnitId: row.base_unit_id,
    isBase: row.is_base,
    status: row.status,
    referenceCount: await countUnitReferences(row.id),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listUnits(
  query: ListQueryInput & { is_base?: string; ids?: string | string[]; names?: string | string[] },
) {
  const parsed = parseListQuery(query)
  const base = db<UnitRow>('data_units')
  applyStatusFilter(base, parsed.status)
  applySearchFilter(base, parsed.q, ['name', 'description', 'symbol'])
  const ids = parseIdsParam(query.ids)
  const names = parseNamesParam(query.names)
  applyIdsFilter(base, ids)
  applyNamesFilter(base, names)

  if (query.is_base === 'true') base.where({ is_base: true })
  if (query.is_base === 'false') base.where({ is_base: false })

  const countResult = await base.clone().count<{ count: number }[]>('* as count')
  const total = Number(countResult[0]?.count ?? 0)

  const { pageSize, page } = bulkListPaging(parsed, ids, names)

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

export async function getUnitById(id: string): Promise<UnitDto | null> {
  const row = await db<UnitRow>('data_units').where({ id }).first()
  return row ? rowToDto(row) : null
}

export async function createUnit(body: CreateUnitBody, role?: DataRole): Promise<UnitDto> {
  await assertUniqueName('data_units', body.name)
  const isBase = body.is_base ?? false
  const id = nanoid()
  const now = db.fn.now(3)
  await db('data_units').insert({
    id,
    name: body.name,
    description: body.description ?? null,
    symbol: body.symbol,
    base_unit_id: isBase ? null : (body.base_unit_id ?? null),
    is_base: isBase,
    status: resolveCreateStatus(role, body.status),
    created_at: now,
    updated_at: now,
  })
  const created = await getUnitById(id)
  if (!created) throw new Error('Failed to create unit')
  return created
}

export async function updateUnit(id: string, body: UpdateUnitBody): Promise<UnitDto> {
  const existing = await db<UnitRow>('data_units').where({ id }).first()
  if (!existing) throw new Error('NOT_FOUND')
  if (body.name) await assertUniqueName('data_units', body.name, id)

  const isBase = body.is_base ?? existing.is_base
  await db('data_units')
    .where({ id })
    .update({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.symbol !== undefined ? { symbol: body.symbol } : {}),
      ...(body.is_base !== undefined ? { is_base: body.is_base } : {}),
      ...(body.base_unit_id !== undefined || body.is_base !== undefined
        ? { base_unit_id: isBase ? null : (body.base_unit_id ?? existing.base_unit_id) }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      updated_at: db.fn.now(3),
    })

  const updated = await getUnitById(id)
  if (!updated) throw new Error('NOT_FOUND')
  return updated
}

export async function deleteUnit(id: string): Promise<void> {
  const refs = await countUnitReferences(id)
  if (refs > 0) throw new Error('FK_CONSTRAINT')
  const deleted = await db('data_units').where({ id }).delete()
  if (!deleted) throw new Error('NOT_FOUND')
}
