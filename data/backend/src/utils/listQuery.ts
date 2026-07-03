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
