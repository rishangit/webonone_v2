import { z } from 'zod'
import {
  DEFAULT_LIST_PAGE_MODE,
  LIST_PAGE_MODE_QUERY,
  type ListPageMode,
} from './listPageModeConstants'
import { persistListPageMode, readPersistedListPageMode } from './listPageModeSession'

export const listPageModeSchema = z.enum(['pagination', 'on-scroll'])

export function parseListPageMode(value: unknown): ListPageMode | null {
  const parsed = listPageModeSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function serializeListPageModeQueryParams(mode: ListPageMode): Record<string, string> {
  return { [LIST_PAGE_MODE_QUERY]: mode }
}

export function parseListPageModeFromQuery(searchParams: URLSearchParams): ListPageMode | null {
  return parseListPageMode(searchParams.get(LIST_PAGE_MODE_QUERY))
}

export function stripListPageModeQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(searchParams)
  params.delete(LIST_PAGE_MODE_QUERY)
  return params
}

export function relayListPageModeQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const fromQuery = parseListPageModeFromQuery(searchParams)
  if (fromQuery) {
    return serializeListPageModeQueryParams(fromQuery)
  }

  const persisted = readPersistedListPageMode()
  if (!persisted) {
    return {}
  }

  return serializeListPageModeQueryParams(persisted)
}

export function applyListPageModeFromQueryParams(searchParams: URLSearchParams): ListPageMode | null {
  const mode = parseListPageModeFromQuery(searchParams)
  if (!mode) return null
  persistListPageMode(mode)
  return mode
}

export function resolveListPageMode(searchParams?: URLSearchParams): ListPageMode {
  const fromQuery = searchParams ? parseListPageModeFromQuery(searchParams) : null
  return fromQuery ?? readPersistedListPageMode() ?? DEFAULT_LIST_PAGE_MODE
}
