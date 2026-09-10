import type { DatasetFilterOperator, DatasetFilters } from '../schemas/datasetQuery.schema.js'

function asComparable(value: unknown): string | number | boolean | null {
  if (value == null) return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function matchRule(
  row: Record<string, unknown>,
  field: string,
  operator: DatasetFilterOperator,
  value: unknown,
): boolean {
  const raw = row[field]
  const left = asComparable(raw)

  switch (operator) {
    case 'eq':
      return left != null && String(left).toLowerCase() === String(value).toLowerCase()
    case 'neq':
      return left == null || String(left).toLowerCase() !== String(value).toLowerCase()
    case 'contains':
      return left != null && String(left).toLowerCase().includes(String(value).toLowerCase())
    case 'in': {
      if (!Array.isArray(value)) return false
      const needle = left == null ? '' : String(left).toLowerCase()
      return value.some((v) => String(v).toLowerCase() === needle)
    }
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const n = asNumber(raw)
      const m = asNumber(value)
      if (n == null || m == null) return false
      if (operator === 'gt') return n > m
      if (operator === 'gte') return n >= m
      if (operator === 'lt') return n < m
      return n <= m
    }
    case 'between': {
      const n = asNumber(raw)
      if (n == null || !Array.isArray(value) || value.length !== 2) return false
      const min = asNumber(value[0])
      const max = asNumber(value[1])
      if (min == null || max == null) return false
      return n >= Math.min(min, max) && n <= Math.max(min, max)
    }
    default:
      return false
  }
}

/** Apply AND filter rules to in-memory rows. */
export function applyDatasetFilters<T extends Record<string, unknown>>(
  rows: T[],
  filters: DatasetFilters,
): T[] {
  if (!filters.rules.length) return rows
  return rows.filter((row) =>
    filters.rules.every((rule) => matchRule(row, rule.field, rule.operator, rule.value)),
  )
}

export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageSize: number } {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(100, Math.max(1, pageSize))
  const total = rows.length
  const offset = (safePage - 1) * safeSize
  return {
    items: rows.slice(offset, offset + safeSize),
    total,
    page: safePage,
    pageSize: safeSize,
  }
}
