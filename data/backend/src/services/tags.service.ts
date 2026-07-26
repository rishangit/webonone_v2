import { nanoid } from 'nanoid'
import { db, type DataRole, type TagRow } from '../models/db.js'
import type { CreateTagBody, UpdateTagBody } from '../schemas/tags.schema.js'
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
import { countTagReferences } from '../utils/referenceCounts.js'

export interface TagDto {
  id: string
  name: string
  description: string | null
  color: string
  status: string
  referenceCount: number
  createdAt: string
  updatedAt: string
}

async function rowToDto(row: TagRow): Promise<TagDto> {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    status: row.status,
    referenceCount: await countTagReferences(row.id),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listTags(query: ListQueryInput & { ids?: string | string[] }) {
  const parsed = parseListQuery(query)
  const base = db<TagRow>('data_tags')
  applyStatusFilter(base, parsed.status)
  applySearchFilter(base, parsed.q)
  const ids = parseIdsParam(query.ids)
  applyIdsFilter(base, ids)

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

export async function getTagById(id: string): Promise<TagDto | null> {
  const row = await db<TagRow>('data_tags').where({ id }).first()
  return row ? rowToDto(row) : null
}

export async function createTag(body: CreateTagBody, role?: DataRole): Promise<TagDto> {
  await assertUniqueName('data_tags', body.name)
  const id = nanoid()
  const now = db.fn.now(3)
  await db('data_tags').insert({
    id,
    name: body.name,
    description: body.description ?? null,
    color: body.color,
    status: resolveCreateStatus(role, body.status),
    created_at: now,
    updated_at: now,
  })
  const created = await getTagById(id)
  if (!created) throw new Error('Failed to create tag')
  return created
}

export async function updateTag(id: string, body: UpdateTagBody): Promise<TagDto> {
  const existing = await db<TagRow>('data_tags').where({ id }).first()
  if (!existing) throw new Error('NOT_FOUND')
  if (body.name) await assertUniqueName('data_tags', body.name, id)

  await db('data_tags')
    .where({ id })
    .update({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      updated_at: db.fn.now(3),
    })

  const updated = await getTagById(id)
  if (!updated) throw new Error('NOT_FOUND')
  return updated
}

export async function deleteTag(id: string): Promise<void> {
  const refs = await countTagReferences(id)
  if (refs > 0) throw new Error('FK_CONSTRAINT')
  const deleted = await db('data_tags').where({ id }).delete()
  if (!deleted) throw new Error('NOT_FOUND')
}
