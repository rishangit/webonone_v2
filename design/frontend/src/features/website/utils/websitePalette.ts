import type { CSSProperties } from 'react'
import { PLATFORM_DEFAULT_THEME, themeDtoToColors } from '@webonone/theme'
import { nanoid } from 'nanoid'
import type {
  WebsiteColorLibraryPalette,
  WebsiteColorToken,
  WebsiteTheme,
  WebsiteThemeColorPalette,
} from '../types'

export const WEBSITE_PALETTE_MIN = 1
export const WEBSITE_PALETTE_MAX = 7

export const WEBSITE_PALETTE_SLOT_IDS = [
  'primary',
  'secondary',
  'background',
  'surface',
  'text',
  'color6',
  'color7',
] as const

export type WebsitePaletteSlotId = (typeof WEBSITE_PALETTE_SLOT_IDS)[number]

export const WEBSITE_PALETTE_SLOT_NAME_KEYS = [
  'colorRolePrimary',
  'colorRoleSecondary',
  'colorRoleBackground',
  'colorRoleSurface',
  'colorRoleText',
  'colorRole6',
  'colorRole7',
] as const

export const WEBSITE_PALETTE_DEFAULT_NAMES = [
  'Primary',
  'Secondary',
  'Background',
  'Surface',
  'Text',
  'Color 6',
  'Color 7',
] as const

export const THEME_LEGACY_COLORS_PALETTE_ID = 'legacy-theme-colors'

export const WEBSITE_PALETTE_IMPORT_EMBED_PATH = '/embed/dialogs/website/themes/import-palette'

export const WEBSITE_PALETTE_IMPORT_DIALOG_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'auto' as const,
}

export const CSS_PALETTE_PLACEHOLDER = `:root {
  --color-1: #344CE2;
  --color-2: #3578E8;
  --color-3: #EFF3FA;
  --color-4: #FFFFFF;
  --color-5: #17211D;
}`

const SLOT_ID_SET = new Set<string>(WEBSITE_PALETTE_SLOT_IDS)
const HEX = /^#[0-9A-Fa-f]{6}$/

function clampPaletteCount(count: number): number {
  return Math.min(WEBSITE_PALETTE_MAX, Math.max(WEBSITE_PALETTE_MIN, count))
}

export function defaultWebsitePaletteSwatches(): string[] {
  const colors = themeDtoToColors(PLATFORM_DEFAULT_THEME)
  return [colors.primary, colors.secondary, colors.background, colors.surface, colors.text]
}

export function defaultWebsitePaletteTokens(names: readonly string[] = WEBSITE_PALETTE_DEFAULT_NAMES): WebsiteColorToken[] {
  return swatchesToColorTokens(defaultWebsitePaletteSwatches(), [], names)
}

export function swatchesToColorTokens(
  swatches: string[],
  existing: WebsiteColorToken[] = [],
  names: readonly string[] = WEBSITE_PALETTE_DEFAULT_NAMES,
): WebsiteColorToken[] {
  const count = clampPaletteCount(swatches.length)
  const byId = new Map(existing.map((token) => [token.id, token]))
  return WEBSITE_PALETTE_SLOT_IDS.slice(0, count).map((id, index) => ({
    id,
    name: byId.get(id)?.name?.trim() || names[index] || WEBSITE_PALETTE_DEFAULT_NAMES[index],
    value: swatches[index]!,
  }))
}

export const THEME_COLOR_SLOT_MAX = 6

function clampColorIndex(index: number, length: number): number {
  if (length <= 0) return 1
  if (!Number.isFinite(index) || index < 1) return 1
  return Math.min(Math.floor(index), length, THEME_COLOR_SLOT_MAX)
}

export function themePaletteById(theme: WebsiteTheme, paletteId?: string | null): WebsiteThemeColorPalette | undefined {
  const palettes = theme.colorPalettes ?? []
  if (paletteId) {
    const match = palettes.find((palette) => palette.id === paletteId)
    if (match) return match
  }
  return palettes.find((palette) => palette.id === theme.colorPaletteId) ?? palettes[0]
}

export function stylePaletteId(theme: WebsiteTheme, override?: string | null): string {
  if (override && theme.colorPalettes.some((palette) => palette.id === override)) return override
  return theme.colorPaletteId || theme.colorPalettes[0]?.id || ''
}

export function paletteOverrideForSave(themePaletteId: string, selectedPaletteId: string): string | null {
  if (!selectedPaletteId || selectedPaletteId === themePaletteId) return null
  return selectedPaletteId
}

export function themeSlotValue(
  theme: WebsiteTheme,
  paletteId: string | null | undefined,
  index: number,
  fallback: string,
): string {
  const palette = themePaletteById(theme, paletteId)
  return palette?.colors[index - 1]?.value ?? fallback
}

export function applyThemeChrome(theme: WebsiteTheme): WebsiteTheme {
  const colorPaletteId = theme.colorPaletteId || theme.colorPalettes[0]?.id || ''
  const palette = themePaletteById({ ...theme, colorPaletteId }, colorPaletteId)
  const length = palette?.colors.length ?? 1
  const pageBackgroundIndex = clampColorIndex(theme.pageBackgroundIndex, length)
  const surfaceIndex = clampColorIndex(theme.surfaceIndex, length)
  const bodyTextIndex = clampColorIndex(theme.bodyTextIndex, length)
  const accent1Index = clampColorIndex(theme.accent1Index, length)
  const accent2Index = clampColorIndex(theme.accent2Index, length)
  const next = {
    ...theme,
    colorPaletteId,
    colorPalettes: theme.colorPalettes ?? [],
    pageBackgroundIndex,
    surfaceIndex,
    bodyTextIndex,
    accent1Index,
    accent2Index,
  }
  return {
    ...next,
    pageBackground: themeSlotValue(next, colorPaletteId, pageBackgroundIndex, '#ffffff'),
    bodyTextColor: themeSlotValue(next, colorPaletteId, bodyTextIndex, '#111827'),
    surfaceColor: themeSlotValue(next, colorPaletteId, surfaceIndex, '#ffffff'),
    accentColor1: themeSlotValue(next, colorPaletteId, accent1Index, '#111827'),
    accentColor2: themeSlotValue(next, colorPaletteId, accent2Index, '#111827'),
  }
}

export function themeChromeCssVars(theme: WebsiteTheme | null): CSSProperties {
  if (!theme) return {}
  const resolved = applyThemeChrome(theme)
  const surface = resolved.surfaceColor || resolved.pageBackground
  const accent1 = resolved.accentColor1 || resolved.bodyTextColor
  const accent2 = resolved.accentColor2 || accent1
  return {
    backgroundColor: resolved.pageBackground,
    color: resolved.bodyTextColor,
    ['--theme-page-bg' as string]: resolved.pageBackground,
    ['--theme-surface' as string]: surface,
    ['--theme-text' as string]: resolved.bodyTextColor,
    ['--theme-accent-1' as string]: accent1,
    ['--theme-accent-2' as string]: accent2,
  }
}

export function normalizeWebsiteTheme(theme: WebsiteTheme): WebsiteTheme {
  return applyThemeChrome({
    ...theme,
    colorPalettes: (theme.colorPalettes ?? []).filter((palette) => palette.id !== THEME_LEGACY_COLORS_PALETTE_ID),
  })
}

export function themePaletteToLibraryPalette(palette: WebsiteThemeColorPalette): WebsiteColorLibraryPalette {
  return palette.colors.length > 0 ? { colors: palette.colors } : { colors: [{ name: palette.name, value: '#111827' }] }
}

export type ThemePaletteSelectOption = {
  id: string
  name: string
  palette: WebsiteColorLibraryPalette
}

export type ThemePaletteColorOption = {
  id: string
  label: string
  swatch: string
}

export function themePaletteSelectOptions(theme: WebsiteTheme): ThemePaletteSelectOption[] {
  return (theme.colorPalettes ?? []).map((palette) => ({
    id: palette.id,
    name: palette.name,
    palette: themePaletteToLibraryPalette(palette),
  }))
}

export function themeColorOptionsForPalette(theme: WebsiteTheme, paletteId: string): ThemePaletteColorOption[] {
  const palette = (theme.colorPalettes ?? []).find((item) => item.id === paletteId)
  if (!palette) return []
  return palette.colors.slice(0, THEME_COLOR_SLOT_MAX).map((color, index) => ({
    id: String(index + 1),
    label: `${color.name} (${color.value})`,
    swatch: color.value,
  }))
}

export function themePaletteColorValues(theme: WebsiteTheme, paletteId: string | null | undefined): string[] {
  const palette = themePaletteById(theme, stylePaletteId(theme, paletteId))
  return (palette?.colors ?? []).slice(0, THEME_COLOR_SLOT_MAX).map((color) => color.value)
}

export function remapColorIndex(theme: WebsiteTheme, toPaletteId: string, index: number): number {
  const palette = theme.colorPalettes.find((item) => item.id === toPaletteId)
  return clampColorIndex(index, palette?.colors.length ?? 1)
}

function basicIndexesForPalette(colorCount: number) {
  const length = Math.max(1, Math.min(colorCount, THEME_COLOR_SLOT_MAX))
  return {
    pageBackgroundIndex: clampColorIndex(length >= 3 ? 3 : 1, length),
    surfaceIndex: clampColorIndex(length >= 4 ? 4 : 1, length),
    bodyTextIndex: clampColorIndex(length >= 5 ? 5 : Math.min(2, length), length),
    accent1Index: 1,
    accent2Index: clampColorIndex(Math.min(2, length), length),
  }
}

export function applyLibraryPaletteGroupToTheme(
  theme: WebsiteTheme,
  input: {
    name: string
    sourceLibraryPaletteId: string | null
    entries: Array<{ name: string; value: string }>
  },
): Pick<
  WebsiteTheme,
  | 'colorPalettes'
  | 'colorPaletteId'
  | 'pageBackgroundIndex'
  | 'surfaceIndex'
  | 'bodyTextIndex'
  | 'accent1Index'
  | 'accent2Index'
> {
  const colors = input.entries.slice(0, THEME_COLOR_SLOT_MAX).map((entry) => ({
    name: entry.name.trim(),
    value: entry.value.trim().toUpperCase(),
  }))
  const palette: WebsiteThemeColorPalette = {
    id: nanoid(8),
    name: input.name.trim(),
    sourceLibraryPaletteId: input.sourceLibraryPaletteId,
    colors,
  }
  const colorPalettes = [...(theme.colorPalettes ?? []).filter((item) => item.id !== THEME_LEGACY_COLORS_PALETTE_ID), palette]
  if ((theme.colorPalettes ?? []).length > 0 && theme.colorPaletteId) {
    return {
      colorPalettes,
      colorPaletteId: theme.colorPaletteId,
      pageBackgroundIndex: theme.pageBackgroundIndex,
      surfaceIndex: theme.surfaceIndex,
      bodyTextIndex: theme.bodyTextIndex,
      accent1Index: theme.accent1Index,
      accent2Index: theme.accent2Index,
    }
  }
  return {
    colorPalettes,
    colorPaletteId: palette.id,
    ...basicIndexesForPalette(colors.length),
  }
}

export function removeThemeColorPaletteGroup(
  theme: WebsiteTheme,
  paletteInstanceId: string,
): Pick<WebsiteTheme, 'colorPalettes' | 'colorPaletteId' | 'textStyles' | 'buttonStyles'> {
  const colorPalettes = (theme.colorPalettes ?? []).filter((item) => item.id !== paletteInstanceId)
  const colorPaletteId = theme.colorPaletteId === paletteInstanceId ? (colorPalettes[0]?.id ?? '') : theme.colorPaletteId
  return {
    colorPalettes,
    colorPaletteId,
    textStyles: theme.textStyles.map((style) =>
      style.colorPaletteId === paletteInstanceId ? { ...style, colorPaletteId: null } : style,
    ),
    buttonStyles: theme.buttonStyles.map((style) =>
      style.colorPaletteId === paletteInstanceId ? { ...style, colorPaletteId: null } : style,
    ),
  }
}

export function parseLibraryPaletteApplyPayload(
  value: unknown,
): {
  swatches: string[]
  colorNames: string[]
  sourceLibraryPaletteId: string | null
  paletteName: string | null
} | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (record.kind !== 'libraryPalette') return null
  const swatches = parsePaletteSwatchesPayload(record.swatches)
  if (!swatches) return null
  const colorNames = record.colorNames
  if (!Array.isArray(colorNames) || colorNames.length !== swatches.length) return null
  if (!colorNames.every((name) => typeof name === 'string' && name.trim().length > 0)) return null
  const sourceLibraryPaletteId =
    typeof record.sourceLibraryPaletteId === 'string' && record.sourceLibraryPaletteId.trim()
      ? record.sourceLibraryPaletteId.trim()
      : null
  const paletteName =
    typeof record.paletteName === 'string' && record.paletteName.trim() ? record.paletteName.trim() : null
  return {
    swatches,
    colorNames: colorNames.map((name) => (name as string).trim()),
    sourceLibraryPaletteId,
    paletteName,
  }
}

export function mergeImportedSwatches(
  swatches: string[],
  existing: WebsiteColorToken[],
  names: readonly string[] = WEBSITE_PALETTE_DEFAULT_NAMES,
  usedIds: Set<string> = new Set(),
): WebsiteColorToken[] {
  const slots = swatchesToColorTokens(swatches, existing, names)
  const slotIds = new Set(slots.map((token) => token.id))
  const leftoverSlots = existing.filter(
    (token) => SLOT_ID_SET.has(token.id) && !slotIds.has(token.id) && usedIds.has(token.id),
  )
  const extras = existing.filter((token) => !SLOT_ID_SET.has(token.id))
  return [...slots, ...leftoverSlots, ...extras]
}

export function addPaletteSlot(
  slots: WebsiteColorToken[],
  names: readonly string[] = WEBSITE_PALETTE_DEFAULT_NAMES,
): WebsiteColorToken[] {
  if (slots.length >= WEBSITE_PALETTE_MAX) return slots
  const nextIndex = slots.length
  return [
    ...slots,
    {
      id: WEBSITE_PALETTE_SLOT_IDS[nextIndex],
      name: names[nextIndex] || WEBSITE_PALETTE_DEFAULT_NAMES[nextIndex],
      value: slots.at(-1)?.value ?? defaultWebsitePaletteSwatches()[0]!,
    },
  ]
}

export function removePaletteSlot(slots: WebsiteColorToken[], id: string): WebsiteColorToken[] {
  if (slots.length <= WEBSITE_PALETTE_MIN) return slots
  return slots.filter((slot) => slot.id !== id)
}

export function updatePaletteSlot(
  slots: WebsiteColorToken[],
  id: string,
  patch: Partial<Pick<WebsiteColorToken, 'name' | 'value'>>,
): WebsiteColorToken[] {
  return slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot))
}

export function pageChromeFromTokens(tokens: WebsiteColorToken[]): {
  pageBackground: string
  bodyTextColor: string
} {
  const byId = new Map(tokens.map((token) => [token.id, token.value]))
  return {
    pageBackground: byId.get('background') ?? byId.get('surface') ?? tokens[0]?.value ?? '#FFFFFF',
    bodyTextColor: byId.get('text') ?? byId.get('primary') ?? tokens.at(-1)?.value ?? '#111827',
  }
}

export function parsePaletteSwatchesPayload(value: unknown): string[] | null {
  if (Array.isArray(value)) return parseSwatchArray(value)
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (Array.isArray(record.swatches)) return parseSwatchArray(record.swatches)
  const semantic = WEBSITE_PALETTE_SLOT_IDS.slice(0, 5).map((id) => record[id])
  if (semantic.every((hex) => typeof hex === 'string' && HEX.test(hex))) {
    return semantic as string[]
  }
  return null
}

function parseSwatchArray(value: unknown[]): string[] | null {
  if (value.length < WEBSITE_PALETTE_MIN || value.length > WEBSITE_PALETTE_MAX) return null
  if (!value.every((hex) => typeof hex === 'string' && HEX.test(hex))) return null
  return value.map((hex) => (hex as string).toUpperCase())
}

