import { z } from 'zod'
import {
  DEFAULT_UI_THEME,
  UI_THEME_IDS,
  UI_THEME_QUERY,
  type UiThemeId,
} from './uiThemeConstants'
import { persistUiTheme, readPersistedUiTheme } from './uiThemeSession'

export const uiThemeSchema = z.enum(UI_THEME_IDS)

export function parseUiTheme(value: unknown): UiThemeId | null {
  const parsed = uiThemeSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function serializeUiThemeQueryParams(theme: UiThemeId): Record<string, string> {
  return { [UI_THEME_QUERY]: theme }
}

export function parseUiThemeFromQuery(searchParams: URLSearchParams): UiThemeId | null {
  return parseUiTheme(searchParams.get(UI_THEME_QUERY))
}

export function stripUiThemeQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(searchParams)
  params.delete(UI_THEME_QUERY)
  return params
}

export function relayUiThemeQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const fromQuery = parseUiThemeFromQuery(searchParams)
  if (fromQuery) {
    return serializeUiThemeQueryParams(fromQuery)
  }

  const persisted = readPersistedUiTheme()
  if (!persisted) {
    return {}
  }

  return serializeUiThemeQueryParams(persisted)
}

export function applyUiThemeFromQueryParams(searchParams: URLSearchParams): UiThemeId | null {
  const theme = parseUiThemeFromQuery(searchParams)
  if (!theme) return null
  persistUiTheme(theme)
  return theme
}

export function resolveUiTheme(searchParams?: URLSearchParams): UiThemeId {
  const fromQuery = searchParams ? parseUiThemeFromQuery(searchParams) : null
  return fromQuery ?? readPersistedUiTheme() ?? DEFAULT_UI_THEME
}
