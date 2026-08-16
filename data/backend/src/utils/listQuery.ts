import type { Knex } from 'knex'
import { db } from '../models/db.js'

export interface ListQueryInput {
  q?: string
  status?: string
  page?: string | number
  pageSize?: string | number
  sort?: string
}

export interface ParsedListQuery {
  q?: string
  status?: 'verified' | 'pending'
  page: number
  pageSize: number
  sortField: string
  sortDir: 'asc' | 'desc'
}

export function parseListQuery(input: ListQueryInput): ParsedListQuery {
  const page = Math.max(1, Number(input.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(input.pageSize) || 20))
  const sort = input.sort ?? 'name'
  const sortDir: 'asc' | 'desc' = sort.startsWith('-') ? 'desc' : 'asc'
  const sortField = sort.replace(/^-/, '') || 'name'
  const allowedSort = new Set(['name', 'updated_at'])
  const safeSortField = allowedSort.has(sortField) ? sortField : 'name'

  let status: 'verified' | 'pending' | undefined
  if (input.status === 'verified' || input.status === 'pending') {
    status = input.status
  }

  return {
    q: input.q?.trim() || undefined,
    status,
    page,
    pageSize,
    sortField: safeSortField,
    sortDir,
  }
}

export function applySearchFilter(
  query: Knex.QueryBuilder,
  q: string | undefined,
  columns: string[] = ['name', 'description'],
) {
  if (!q) return query
  const pattern = `%${q}%`
  return query.where(function applySearch() {
    for (const col of columns) {
      this.orWhere(col, 'like', pattern)
    }
  })
}

export function applyStatusFilter(query: Knex.QueryBuilder, status?: 'verified' | 'pending') {
  if (status) {
    query.where({ status })
  }
  return query
}

/** Accepts repeated `ids=` query params and/or comma-separated values. */
export function parseIdsParam(ids?: string | string[]): string[] {
  if (ids == null) return []
  const raw = Array.isArray(ids) ? ids : [ids]
  const out: string[] = []
  for (const value of raw) {
    for (const part of value.split(',')) {
      const trimmed = part.trim()
      if (trimmed) out.push(trimmed)
    }
  }
  return [...new Set(out)]
}

export function applyIdsFilter(query: Knex.QueryBuilder, ids: string[]) {
  if (ids.length > 0) {
    query.whereIn('id', ids)
  }
  return query
}

/** Accepts repeated `names=` query params and/or comma-separated values. Caps at 100. */
export function parseNamesParam(names?: string | string[]): string[] {
  return parseIdsParam(names).slice(0, 100)
}

export function applyNamesFilter(query: Knex.QueryBuilder, names: string[]) {
  if (names.length === 0) {
    return query
  }
  const lowered = names.map((name) => name.toLowerCase())
  return query.whereRaw(
    `LOWER(name) IN (${lowered.map(() => '?').join(', ')})`,
    lowered,
  )
}

export function bulkListPaging(parsed: ParsedListQuery, ...bulkSets: string[][]) {
  const bulkCount = Math.max(0, ...bulkSets.map((set) => set.length))
  return {
    pageSize: bulkCount > 0 ? Math.min(100, Math.max(parsed.pageSize, bulkCount)) : parsed.pageSize,
    page: bulkCount > 0 ? 1 : parsed.page,
  }
}

export async function assertUniqueName(
  table: string,
  name: string,
  excludeId?: string,
): Promise<void> {
  const query = db(table).whereRaw('LOWER(name) = ?', [name.toLowerCase()])
  if (excludeId) {
    query.whereNot('id', excludeId)
  }
  const existing = await query.first()
  if (existing) {
    throw new Error('DUPLICATE_NAME')
  }
}
