import { z } from 'zod'
import {
  DEFAULT_LIST_DISPLAY_MODE,
  LIST_DISPLAY_MODE_QUERY,
  type ListDisplayMode,
} from './listDisplayModeConstants'
import { persistListDisplayMode, readPersistedListDisplayMode } from './listDisplayModeSession'

export const listDisplayModeSchema = z.enum(['list', 'grid', 'card'])

export function parseListDisplayMode(value: unknown): ListDisplayMode | null {
  const parsed = listDisplayModeSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function serializeListDisplayModeQueryParams(
  mode: ListDisplayMode,
): Record<string, string> {
  return { [LIST_DISPLAY_MODE_QUERY]: mode }
}

export function parseListDisplayModeFromQuery(
  searchParams: URLSearchParams,
): ListDisplayMode | null {
  return parseListDisplayMode(searchParams.get(LIST_DISPLAY_MODE_QUERY))
}

export function stripListDisplayModeQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(searchParams)
  params.delete(LIST_DISPLAY_MODE_QUERY)
  return params
}

export function relayListDisplayModeQueryParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  const fromQuery = parseListDisplayModeFromQuery(searchParams)
  if (fromQuery) {
    return serializeListDisplayModeQueryParams(fromQuery)
  }

  const persisted = readPersistedListDisplayMode()
  if (!persisted) {
    return {}
  }

  return serializeListDisplayModeQueryParams(persisted)
}

export function applyListDisplayModeFromQueryParams(
  searchParams: URLSearchParams,
): ListDisplayMode | null {
  const mode = parseListDisplayModeFromQuery(searchParams)
  if (!mode) return null
  persistListDisplayMode(mode)
  return mode
}

export function resolveListDisplayMode(searchParams?: URLSearchParams): ListDisplayMode {
  const fromQuery = searchParams ? parseListDisplayModeFromQuery(searchParams) : null
  return fromQuery ?? readPersistedListDisplayMode() ?? DEFAULT_LIST_DISPLAY_MODE
}
