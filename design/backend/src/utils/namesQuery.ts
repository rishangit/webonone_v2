import type { Knex } from 'knex'

/** Accepts a comma-separated `names` value and/or repeated query params. Caps at 100. */
export function parseNamesParam(names?: string | string[]): string[] {
  const raw = Array.isArray(names) ? names : typeof names === 'string' ? [names] : []
  const values: string[] = []
  for (const entry of raw) {
    for (const part of entry.split(',')) {
      const trimmed = part.trim()
      if (trimmed) values.push(trimmed)
    }
  }
  return [...new Set(values)].slice(0, 100)
}

export function readNamesQuery(value: unknown): string | string[] | undefined {
  if (typeof value === 'string' && value.trim()) return value
  if (Array.isArray(value)) {
    const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    return strings.length > 0 ? strings : undefined
  }
  return undefined
}

/** `column` is a fixed SQL identifier (`name` or `p.name`), never request input. */
export function applyNamesFilter(query: Knex.QueryBuilder, column: 'name' | 'p.name', names: string[]) {
  if (names.length === 0) return query
  const lowered = names.map((name) => name.toLowerCase())
  return query.whereRaw(`LOWER(${column}) IN (${lowered.map(() => '?').join(', ')})`, lowered)
}

export function namedListWindow(
  input: { page?: number; pageSize?: number; names?: string | string[] },
  fallbackPageSize: number,
): { names: string[]; page: number; pageSize: number; offset: number } {
  const names = parseNamesParam(input.names)
  const requested = input.pageSize ?? fallbackPageSize
  const pageSize = Math.min(100, Math.max(1, names.length > 0 ? Math.max(requested, names.length) : requested))
  const page = names.length > 0 ? 1 : Math.max(1, input.page ?? 1)
  return { names, page, pageSize, offset: (page - 1) * pageSize }
}
