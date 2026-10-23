import { nanoid } from 'nanoid'
import type {
  CreateWebsiteThemeBody,
  UpdateWebsiteThemeBody,
  WebsiteThemeColorPalette,
} from '../schemas/websiteThemes.schema.js'

export const THEME_COLOR_SLOT_MAX = 6

type ColorToken = { id: string; name: string; value: string }
type PaletteColor = { name: string; value: string }

export type ThemeColorWrite = {
  color_palette_id: string | null
  page_background_palette_index: number | null
  surface_palette_index: number | null
  body_text_palette_index: number | null
  accent_1_palette_index: number | null
  accent_2_palette_index: number | null
  page_background_index: number | null
  surface_index: number | null
  body_text_index: number | null
  accent_1_index: number | null
  accent_2_index: number | null
  color_palettes: string
}

export type ThemeColorRead = {
  colorPaletteId: string
  pageBackgroundPaletteIndex: number | null
  surfacePaletteIndex: number | null
  bodyTextPaletteIndex: number | null
  accent1PaletteIndex: number | null
  accent2PaletteIndex: number | null
  pageBackgroundIndex: number | null
  surfaceIndex: number | null
  bodyTextIndex: number | null
  accent1Index: number | null
  accent2Index: number | null
  pageBackground: string
  bodyTextColor: string
  surfaceColor: string
  accentColor1: string
  accentColor2: string
  colorPalettes: WebsiteThemeColorPalette[]
}

type LegacyPalette = {
  id?: string
  name?: string
  sourceLibraryPaletteId?: string | null
  colorIds?: string[]
  colors?: Array<{ name?: string; value?: string }>
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function asArray(raw: unknown): unknown[] {
  const value = parseJson(raw)
  return Array.isArray(value) ? value : []
}

function tokensFrom(raw: unknown): ColorToken[] {
  return asArray(raw).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (typeof record.id !== 'string' || typeof record.value !== 'string') return []
    return [
      {
        id: record.id,
        name: typeof record.name === 'string' && record.name.trim() ? record.name.trim() : 'Color',
        value: record.value.trim(),
      },
    ]
  })
}

function slot(name: string, value: string): PaletteColor {
  return { name: name.trim() || 'Color', value: value.trim() }
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 1
  if (!Number.isFinite(index) || index < 1) return 1
  return Math.min(Math.floor(index), length, THEME_COLOR_SLOT_MAX)
}

function paletteSlots(palette: WebsiteThemeColorPalette | undefined, index: number | null, fallback: string): string {
  if (index == null) return fallback
  const color = palette?.colors[index - 1]
  return color?.value || fallback
}

function readOptionalIndex(value: number | null | undefined, length: number): number | null {
  if (value == null) return null
  return clampIndex(value, length)
}

/** 1-based position in the theme palette list. Null follows the theme palette. */
function readPaletteIndex(value: number | null | undefined, paletteCount: number): number | null {
  if (value == null || paletteCount < 1) return null
  const index = Math.floor(Number(value))
  if (!Number.isFinite(index) || index < 1 || index > paletteCount) return null
  return index
}

function paletteForRole(
  palettes: WebsiteThemeColorPalette[],
  themePalette: WebsiteThemeColorPalette | undefined,
  paletteIndex: number | null,
): WebsiteThemeColorPalette | undefined {
  if (paletteIndex != null) return palettes[paletteIndex - 1]
  return themePalette
}

export function readThemeColorFields(row: {
  color_palette_id?: string | null
  page_background_palette_index?: number | null
  surface_palette_index?: number | null
  body_text_palette_index?: number | null
  accent_1_palette_index?: number | null
  accent_2_palette_index?: number | null
  page_background_index?: number | null
  surface_index?: number | null
  body_text_index?: number | null
  accent_1_index?: number | null
  accent_2_index?: number | null
  color_palettes?: unknown
}): ThemeColorRead {
  const colorPalettes = asArray(row.color_palettes).flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as LegacyPalette
    if (typeof record.id !== 'string' || typeof record.name !== 'string') return []
    const colors = (record.colors ?? [])
      .filter((color) => color && typeof color.value === 'string')
      .slice(0, THEME_COLOR_SLOT_MAX)
      .map((color) => slot(typeof color.name === 'string' ? color.name : 'Color', color.value as string))
    if (colors.length === 0) return []
    return [
      {
        id: record.id,
        name: record.name,
        sourceLibraryPaletteId: record.sourceLibraryPaletteId ?? null,
        colors,
      },
    ]
  })
  const colorPaletteId =
    (row.color_palette_id && colorPalettes.some((palette) => palette.id === row.color_palette_id)
      ? row.color_palette_id
      : colorPalettes[0]?.id) ?? ''
  const themePalette = colorPalettes.find((item) => item.id === colorPaletteId) ?? colorPalettes[0]
  const pageBackgroundPaletteIndex = readPaletteIndex(row.page_background_palette_index, colorPalettes.length)
  const surfacePaletteIndex = readPaletteIndex(row.surface_palette_index, colorPalettes.length)
  const bodyTextPaletteIndex = readPaletteIndex(row.body_text_palette_index, colorPalettes.length)
  const accent1PaletteIndex = readPaletteIndex(row.accent_1_palette_index, colorPalettes.length)
  const accent2PaletteIndex = readPaletteIndex(row.accent_2_palette_index, colorPalettes.length)
  const pagePalette = paletteForRole(colorPalettes, themePalette, pageBackgroundPaletteIndex)
  const surfacePalette = paletteForRole(colorPalettes, themePalette, surfacePaletteIndex)
  const textPalette = paletteForRole(colorPalettes, themePalette, bodyTextPaletteIndex)
  const accent1Palette = paletteForRole(colorPalettes, themePalette, accent1PaletteIndex)
  const accent2Palette = paletteForRole(colorPalettes, themePalette, accent2PaletteIndex)
  const pageBackgroundIndex = readOptionalIndex(row.page_background_index, pagePalette?.colors.length ?? 1)
  const surfaceIndex = readOptionalIndex(row.surface_index, surfacePalette?.colors.length ?? 1)
  const bodyTextIndex = readOptionalIndex(row.body_text_index, textPalette?.colors.length ?? 1)
  const accent1Index = readOptionalIndex(row.accent_1_index, accent1Palette?.colors.length ?? 1)
  const accent2Index = readOptionalIndex(row.accent_2_index, accent2Palette?.colors.length ?? 1)
  return {
    colorPaletteId,
    pageBackgroundPaletteIndex,
    surfacePaletteIndex,
    bodyTextPaletteIndex,
    accent1PaletteIndex,
    accent2PaletteIndex,
    pageBackgroundIndex,
    surfaceIndex,
    bodyTextIndex,
    accent1Index,
    accent2Index,
    pageBackground: paletteSlots(pagePalette, pageBackgroundIndex, 'transparent'),
    bodyTextColor: paletteSlots(textPalette, bodyTextIndex, 'transparent'),
    surfaceColor: paletteSlots(surfacePalette, surfaceIndex, 'transparent'),
    accentColor1: paletteSlots(accent1Palette, accent1Index, 'transparent'),
    accentColor2: paletteSlots(accent2Palette, accent2Index, 'transparent'),
    colorPalettes,
  }
}

function locateColor(
  tokens: ColorToken[],
  legacyPalettes: LegacyPalette[],
  palettes: Array<{ id: string; colors: PaletteColor[] }>,
  colorId: string,
): { paletteId: string; index: number } | null {
  if (!colorId) return null
  for (const palette of legacyPalettes) {
    const ids = palette.colorIds ?? []
    const index = ids.indexOf(colorId)
    if (index < 0 || !palette.id) continue
    const migrated = palettes.find((item) => item.id === palette.id)
    if (migrated && index < migrated.colors.length) return { paletteId: palette.id, index: index + 1 }
  }
  const token = tokens.find((item) => item.id === colorId)
  if (!token) return null
  for (const palette of palettes) {
    const index = palette.colors.findIndex((color) => color.value.toLowerCase() === token.value.toLowerCase())
    if (index >= 0) return { paletteId: palette.id, index: index + 1 }
  }
  return null
}

export function migrateThemeColorRecord(row: {
  page_background?: string | null
  body_text_color?: string | null
  colors?: unknown
  color_palettes?: unknown
  color_roles?: unknown
  text_styles?: unknown
  button_styles?: unknown
}): {
  color_palette_id: string | null
  page_background_index: number
  surface_index: number
  body_text_index: number
  accent_1_index: number
  accent_2_index: number
  color_palettes: WebsiteThemeColorPalette[]
  text_styles: unknown[]
  button_styles: unknown[]
} {
  const tokens = tokensFrom(row.colors)
  const byId = new Map(tokens.map((token) => [token.id, token]))
  const legacyPalettes = asArray(row.color_palettes).flatMap((item) =>
    item && typeof item === 'object' ? [item as LegacyPalette] : [],
  )
  const palettes: WebsiteThemeColorPalette[] = []
  for (const palette of legacyPalettes) {
    if (!palette.id) continue
    const embedded = (palette.colors ?? []).filter((color) => color && typeof color.value === 'string')
    const fromIds = (palette.colorIds ?? [])
      .map((id) => byId.get(id))
      .filter((token): token is ColorToken => Boolean(token))
    const source = embedded.length > 0 ? embedded : fromIds
    const colors = source.slice(0, THEME_COLOR_SLOT_MAX).map((color) =>
      slot(typeof color.name === 'string' ? color.name : 'Color', String(color.value)),
    )
    if (colors.length === 0) continue
    palettes.push({
      id: palette.id,
      name: palette.name?.trim() || 'Palette',
      sourceLibraryPaletteId: palette.sourceLibraryPaletteId ?? null,
      colors,
    })
  }
  if (palettes.length === 0 && tokens.length > 0) {
    palettes.push({
      id: 'default',
      name: 'Palette',
      sourceLibraryPaletteId: null,
      colors: tokens.slice(0, THEME_COLOR_SLOT_MAX).map((token) => slot(token.name, token.value)),
    })
  }

  const rolesRaw = parseJson(row.color_roles)
  const roles = rolesRaw && typeof rolesRaw === 'object' ? (rolesRaw as Record<string, unknown>) : {}
  const roleId = (key: string) => (typeof roles[key] === 'string' ? roles[key] : '')
  const pageLoc = locateColor(tokens, legacyPalettes, palettes, roleId('pageBackgroundColorId'))
  const colorPaletteId = pageLoc?.paletteId ?? palettes[0]?.id ?? null
  const palette = palettes.find((item) => item.id === colorPaletteId) ?? palettes[0]
  const length = palette?.colors.length ?? 1

  function indexFor(colorId: string, fallback: number): number {
    const located = locateColor(tokens, legacyPalettes, palettes, colorId)
    if (located && located.paletteId === colorPaletteId) return clampIndex(located.index, length)
    if (colorId) {
      const token = byId.get(colorId)
      if (token && palette) {
        const index = palette.colors.findIndex((color) => color.value.toLowerCase() === token.value.toLowerCase())
        if (index >= 0) return index + 1
      }
    }
    return clampIndex(fallback, length)
  }

  const backgroundToken =
    tokens.find((token) => token.value.toLowerCase() === (row.page_background ?? '').trim().toLowerCase())?.id ?? ''
  const textToken =
    tokens.find((token) => token.value.toLowerCase() === (row.body_text_color ?? '').trim().toLowerCase())?.id ?? ''

  function stylePalette(colorIds: string[]): string | null {
    const located = colorIds
      .map((id) => locateColor(tokens, legacyPalettes, palettes, id))
      .find((item) => item && item.paletteId !== colorPaletteId)
    return located?.paletteId ?? null
  }

  function styleIndex(colorId: string, paletteId: string | null): number {
    const targetId = paletteId || colorPaletteId
    const target = palettes.find((item) => item.id === targetId)
    const located = locateColor(tokens, legacyPalettes, palettes, colorId)
    if (located && located.paletteId === targetId) return clampIndex(located.index, target?.colors.length ?? 1)
    const token = byId.get(colorId)
    if (token && target) {
      const index = target.colors.findIndex((color) => color.value.toLowerCase() === token.value.toLowerCase())
      if (index >= 0) return index + 1
    }
    return 1
  }

  const textStyles = asArray(row.text_styles).map((item) => {
    if (!item || typeof item !== 'object') return item
    const style = { ...(item as Record<string, unknown>) }
    const colorId = typeof style.colorId === 'string' ? style.colorId : ''
    const override = stylePalette([colorId])
    style.colorIndex =
      style.colorIndex === null || typeof style.colorIndex === 'number'
        ? style.colorIndex
        : styleIndex(colorId, override)
    style.colorPaletteId = typeof style.colorPaletteId === 'string' ? style.colorPaletteId : override
    delete style.colorId
    return style
  })

  const buttonStyles = asArray(row.button_styles).map((item) => {
    if (!item || typeof item !== 'object') return item
    const style = { ...(item as Record<string, unknown>) }
    const backgroundId = typeof style.backgroundColorId === 'string' ? style.backgroundColorId : ''
    const textId = typeof style.textColorId === 'string' ? style.textColorId : ''
    const borderId = typeof style.borderColorId === 'string' ? style.borderColorId : ''
    const override = stylePalette([backgroundId, textId, borderId])
    style.backgroundColorIndex =
      style.backgroundColorIndex === null || typeof style.backgroundColorIndex === 'number'
        ? style.backgroundColorIndex
        : styleIndex(backgroundId, override)
    style.textColorIndex =
      style.textColorIndex === null || typeof style.textColorIndex === 'number'
        ? style.textColorIndex
        : styleIndex(textId, override)
    style.borderColorIndex =
      style.borderColorIndex === null || typeof style.borderColorIndex === 'number'
        ? style.borderColorIndex
        : styleIndex(borderId, override)
    style.colorPaletteId = typeof style.colorPaletteId === 'string' ? style.colorPaletteId : override
    delete style.backgroundColorId
    delete style.textColorId
    delete style.borderColorId
    return style
  })

  return {
    color_palette_id: colorPaletteId,
    page_background_index: indexFor(roleId('pageBackgroundColorId') || backgroundToken, 1),
    surface_index: indexFor(roleId('surfaceColorId'), 1),
    body_text_index: indexFor(roleId('bodyTextColorId') || textToken, Math.min(2, length)),
    accent_1_index: indexFor(roleId('accentColor1Id'), 1),
    accent_2_index: indexFor(roleId('accentColor2Id'), Math.min(2, length)),
    color_palettes: palettes,
    text_styles: textStyles,
    button_styles: buttonStyles,
  }
}

export function starterThemeColumns(theme: {
  pageBackground: string
  bodyTextColor: string
  colors: Array<{ id: string; name: string; value: string }>
  textStyles: unknown[]
  buttonStyles: unknown[]
}) {
  const migrated = migrateThemeColorRecord({
    page_background: theme.pageBackground,
    body_text_color: theme.bodyTextColor,
    colors: theme.colors,
    color_palettes: theme.colors.length
      ? [{ id: 'default', name: 'Brand', colorIds: theme.colors.map((color) => color.id) }]
      : [],
    color_roles: {
      pageBackgroundColorId:
        theme.colors.find((color) => color.value.toLowerCase() === theme.pageBackground.toLowerCase())?.id ??
        theme.colors.find((color) => color.id === 'background')?.id ??
        '',
      surfaceColorId: theme.colors.find((color) => color.id === 'surface')?.id ?? '',
      bodyTextColorId:
        theme.colors.find((color) => color.value.toLowerCase() === theme.bodyTextColor.toLowerCase())?.id ??
        theme.colors.find((color) => color.id === 'text')?.id ??
        '',
      accentColor1Id: theme.colors.find((color) => color.id === 'primary')?.id ?? '',
      accentColor2Id: theme.colors.find((color) => color.id === 'secondary')?.id ?? '',
    },
    text_styles: theme.textStyles,
    button_styles: theme.buttonStyles,
  })
  return {
    color_palette_id: migrated.color_palette_id,
    page_background_index: migrated.page_background_index,
    surface_index: migrated.surface_index,
    body_text_index: migrated.body_text_index,
    accent_1_index: migrated.accent_1_index,
    accent_2_index: migrated.accent_2_index,
    color_palettes: JSON.stringify(migrated.color_palettes),
    text_styles: JSON.stringify(migrated.text_styles),
    button_styles: JSON.stringify(migrated.button_styles),
  }
}

function seedPalette(pageBackground: string, bodyTextColor: string): WebsiteThemeColorPalette {
  return {
    id: nanoid(8),
    name: 'Palette',
    sourceLibraryPaletteId: null,
    colors: [slot('Background', pageBackground || '#ffffff'), slot('Text', bodyTextColor || '#111827')],
  }
}

export function writeThemeColorFields(body: CreateWebsiteThemeBody): ThemeColorWrite {
  let colorPalettes = body.colorPalettes ?? []
  let colorPaletteId = body.colorPaletteId || colorPalettes[0]?.id || ''
  let pageBackgroundIndex = body.pageBackgroundIndex
  let bodyTextIndex = body.bodyTextIndex
  if (colorPalettes.length === 0) {
    const seeded = seedPalette(body.pageBackground, body.bodyTextColor)
    colorPalettes = [seeded]
    colorPaletteId = seeded.id
    pageBackgroundIndex = 1
    bodyTextIndex = 2
  }
  if (!colorPaletteId) colorPaletteId = colorPalettes[0]?.id ?? ''
  const paletteCount = colorPalettes.length
  return {
    color_palette_id: colorPaletteId || null,
    page_background_palette_index: readPaletteIndex(body.pageBackgroundPaletteIndex, paletteCount),
    surface_palette_index: readPaletteIndex(body.surfacePaletteIndex, paletteCount),
    body_text_palette_index: readPaletteIndex(body.bodyTextPaletteIndex, paletteCount),
    accent_1_palette_index: readPaletteIndex(body.accent1PaletteIndex, paletteCount),
    accent_2_palette_index: readPaletteIndex(body.accent2PaletteIndex, paletteCount),
    page_background_index: pageBackgroundIndex,
    surface_index: body.surfaceIndex,
    body_text_index: bodyTextIndex,
    accent_1_index: body.accent1Index,
    accent_2_index: body.accent2Index,
    color_palettes: JSON.stringify(colorPalettes),
  }
}

export function patchThemeColorFields(existingRow: Parameters<typeof readThemeColorFields>[0], body: UpdateWebsiteThemeBody): Record<string, unknown> {
  const existing = readThemeColorFields(existingRow)
  const updates: Record<string, unknown> = {}
  let palettes = body.colorPalettes ?? existing.colorPalettes
  if (body.colorPalettes != null) updates.color_palettes = JSON.stringify(palettes)
  if (body.colorPaletteId != null) updates.color_palette_id = body.colorPaletteId || null
  const paletteCount = palettes.length
  if (body.pageBackgroundPaletteIndex !== undefined) {
    updates.page_background_palette_index = readPaletteIndex(body.pageBackgroundPaletteIndex, paletteCount)
  }
  if (body.surfacePaletteIndex !== undefined) {
    updates.surface_palette_index = readPaletteIndex(body.surfacePaletteIndex, paletteCount)
  }
  if (body.bodyTextPaletteIndex !== undefined) {
    updates.body_text_palette_index = readPaletteIndex(body.bodyTextPaletteIndex, paletteCount)
  }
  if (body.accent1PaletteIndex !== undefined) {
    updates.accent_1_palette_index = readPaletteIndex(body.accent1PaletteIndex, paletteCount)
  }
  if (body.accent2PaletteIndex !== undefined) {
    updates.accent_2_palette_index = readPaletteIndex(body.accent2PaletteIndex, paletteCount)
  }
  if (body.pageBackgroundIndex !== undefined) updates.page_background_index = body.pageBackgroundIndex
  if (body.surfaceIndex !== undefined) updates.surface_index = body.surfaceIndex
  if (body.bodyTextIndex !== undefined) updates.body_text_index = body.bodyTextIndex
  if (body.accent1Index !== undefined) updates.accent_1_index = body.accent1Index
  if (body.accent2Index !== undefined) updates.accent_2_index = body.accent2Index

  const paletteId = (typeof updates.color_palette_id === 'string' ? updates.color_palette_id : existing.colorPaletteId) || palettes[0]?.id
  const pageIndex = updates.page_background_index !== undefined ? updates.page_background_index : existing.pageBackgroundIndex
  const textIndex = updates.body_text_index !== undefined ? updates.body_text_index : existing.bodyTextIndex
  const pagePaletteIndex =
    updates.page_background_palette_index !== undefined
      ? (updates.page_background_palette_index as number | null)
      : existing.pageBackgroundPaletteIndex
  const textPaletteIndex =
    updates.body_text_palette_index !== undefined
      ? (updates.body_text_palette_index as number | null)
      : existing.bodyTextPaletteIndex
  const pagePaletteId = paletteForRole(palettes, palettes.find((item) => item.id === paletteId) ?? palettes[0], pagePaletteIndex)?.id
  const textPaletteId = paletteForRole(palettes, palettes.find((item) => item.id === paletteId) ?? palettes[0], textPaletteIndex)?.id
  let changed = false
  if (body.pageBackground && typeof pageIndex === 'number') {
    palettes = paintSlot(palettes, pagePaletteId, pageIndex, body.pageBackground)
    changed = true
  }
  if (body.bodyTextColor && typeof textIndex === 'number') {
    palettes = paintSlot(palettes, textPaletteId, textIndex, body.bodyTextColor)
    changed = true
  }
  if (changed) updates.color_palettes = JSON.stringify(palettes)
  if (palettes.length === 0 && (body.pageBackground || body.bodyTextColor)) {
    const seeded = seedPalette(body.pageBackground || '#ffffff', body.bodyTextColor || '#111827')
    updates.color_palettes = JSON.stringify([seeded])
    updates.color_palette_id = seeded.id
    updates.page_background_index = 1
    updates.body_text_index = 2
  }
  return updates
}

function paintSlot(
  palettes: WebsiteThemeColorPalette[],
  paletteId: string | undefined,
  index: number,
  value: string,
): WebsiteThemeColorPalette[] {
  return palettes.map((palette) => {
    if (paletteId && palette.id !== paletteId) return palette
    if (!paletteId && palette !== palettes[0]) return palette
    const colors = palette.colors.map((color, colorIndex) =>
      colorIndex === index - 1 ? { ...color, value } : color,
    )
    return { ...palette, colors }
  })
}
