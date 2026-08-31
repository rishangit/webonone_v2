import { z } from 'zod'
import { THEME_CONTRACT_VERSION, THEME_CONTRACT_VERSION_V1, THEME_QUERY } from './constants'
import { applyThemeVariables } from './applyTheme'
import { persistAppliedTheme, readPersistedTheme } from './themeSession'
import type { ColorMode, ThemeDto, ThemePayload } from './types'
import { isHexColor } from './colorUtils'
import {
  themeColorsToUrlSlots,
  themeDtoToColors,
  urlSlotsToThemeDto,
  v1UrlSlotsToThemeDto,
} from './themeMapper'

const colorModeSchema = z.enum(['light', 'dark'])

const themeDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color1: z.string().refine(isHexColor),
  color2: z.string().refine(isHexColor),
  color3: z.string().refine(isHexColor),
  color4: z.string().refine(isHexColor),
  color5: z.string().refine(isHexColor),
})

const themePayloadSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  theme: themeDtoSchema,
  colorMode: colorModeSchema,
})

function parseColorsParam(raw: string): [string, string, string, string, string] | null {
  const parts = raw.split(',').map((p) => p.trim())
  if (parts.length !== 5) return null
  const withHash = parts.map((p) => (p.startsWith('#') ? p : `#${p}`).toUpperCase())
  if (!withHash.every(isHexColor)) return null
  return withHash as [string, string, string, string, string]
}

export function serializeThemeQueryParams(payload: ThemePayload): Record<string, string> {
  const colors = themeColorsToUrlSlots(themeDtoToColors(payload.theme))
    .map((c) => c.replace('#', '').toUpperCase())
    .join(',')

  const params: Record<string, string> = {
    [THEME_QUERY.V]: THEME_CONTRACT_VERSION,
    [THEME_QUERY.MODE]: payload.colorMode,
    [THEME_QUERY.COLORS]: colors,
  }

  if (payload.theme.name) {
    params[THEME_QUERY.NAME] = payload.theme.name
  }

  return params
}

export function parseThemeQueryParams(searchParams: URLSearchParams): ThemePayload | null {
  const version = searchParams.get(THEME_QUERY.V)
  const modeResult = colorModeSchema.safeParse(searchParams.get(THEME_QUERY.MODE))
  const colorsRaw = searchParams.get(THEME_QUERY.COLORS)
  if (!modeResult.success || !colorsRaw) return null

  const colors = parseColorsParam(colorsRaw)
  if (!colors) return null

  const name = searchParams.get(THEME_QUERY.NAME) ?? 'Redirect Theme'
  const meta = { id: 'redirect-theme', name }

  if (version === THEME_CONTRACT_VERSION) {
    return {
      version: 2,
      theme: urlSlotsToThemeDto(colors, meta),
      colorMode: modeResult.data,
    }
  }

  if (version === THEME_CONTRACT_VERSION_V1) {
    return {
      version: 1,
      theme: v1UrlSlotsToThemeDto(colors, meta),
      colorMode: modeResult.data,
    }
  }

  return null
}

export function stripThemeQueryParams(searchParams: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(searchParams)
  Object.values(THEME_QUERY).forEach((key) => params.delete(key))
  return params
}

export function relayThemeQueryParams(searchParams: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.values(THEME_QUERY)) {
    const value = searchParams.get(key)
    if (value) out[key] = value
  }
  if (Object.keys(out).length > 0) {
    return out
  }

  const persisted = readPersistedTheme()
  if (!persisted) {
    return out
  }

  return serializeThemeQueryParams(persisted)
}

export function applyThemeFromQueryParams(
  searchParams: URLSearchParams,
  root: HTMLElement = document.documentElement,
): ThemePayload | null {
  const payload = parseThemeQueryParams(searchParams)
  if (!payload) return null
  applyThemeVariables(payload, root)
  persistAppliedTheme(payload)
  return payload
}

export function appendThemeToUrl(url: string | URL, payload: ThemePayload): URL {
  const target = typeof url === 'string' ? new URL(url) : new URL(url.toString())
  const params = serializeThemeQueryParams(payload)
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value)
  }
  return target
}

export { themePayloadSchema, themeDtoSchema, colorModeSchema }
