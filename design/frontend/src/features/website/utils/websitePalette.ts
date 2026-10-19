import type { CSSProperties } from 'react'
import { PLATFORM_DEFAULT_THEME, themeDtoToColors } from '@webonone/theme'
import { nanoid } from 'nanoid'
import type {
  WebsiteColorLibraryPalette,
  WebsiteColorToken,
  WebsiteTheme,
  WebsiteThemeColorPalette,
  WebsiteThemeColorRoles,
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

export const THEME_COLOR_ROLE_KEYS = [
  'pageBackgroundColorId',
  'surfaceColorId',
  'bodyTextColorId',
  'accentColor1Id',
  'accentColor2Id',
] as const

export function emptyThemeColorRoles(): WebsiteThemeColorRoles {
  return {
    pageBackgroundColorId: '',
    surfaceColorId: '',
    bodyTextColorId: '',
    accentColor1Id: '',
    accentColor2Id: '',
  }
}

export function parseThemeColorRoles(raw: unknown): WebsiteThemeColorRoles {
  const roles = emptyThemeColorRoles()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return roles
  const record = raw as Record<string, unknown>
  for (const key of THEME_COLOR_ROLE_KEYS) {
    const value = record[key]
    roles[key] = typeof value === 'string' ? value : ''
  }
  return roles
}

export function themeColorRoleIds(roles: WebsiteThemeColorRoles): string[] {
  return THEME_COLOR_ROLE_KEYS.map((key) => roles[key])
}

function themeHasColorId(theme: WebsiteTheme, id: string): boolean {
  return Boolean(id) && theme.colors.some((color) => color.id === id)
}

function themeColorIdForHex(theme: WebsiteTheme, hex: string, preferIds?: string[]): string {
  const normalized = hex.trim().toLowerCase()
  if (!normalized) return ''
  const match = (color: WebsiteColorToken) => color.value.trim().toLowerCase() === normalized
  if (preferIds?.length) {
    const preferred = theme.colors.find((color) => preferIds.includes(color.id) && match(color))
    if (preferred) return preferred.id
  }
  return theme.colors.find(match)?.id ?? ''
}

export function resolveThemeColorValue(theme: WebsiteTheme, colorId: string, fallback: string): string {
  return theme.colors.find((color) => color.id === colorId)?.value ?? fallback
}

export function inferThemeColorRoles(theme: WebsiteTheme): WebsiteThemeColorRoles {
  const current = parseThemeColorRoles(theme.colorRoles)
  const paletteId = inferThemePaletteId(theme, themeColorRoleIds(current))
  const paletteIds = themeColorOptionsForPalette(theme, paletteId).map((color) => color.id)
  const pool = paletteIds.length > 0 ? paletteIds : theme.colors.map((color) => color.id)
  const pick = (...candidates: string[]) =>
    candidates.find((id) => themeHasColorId(theme, id)) ?? pool[0] ?? ''
  const bgMatch = themeColorIdForHex(theme, theme.pageBackground, pool)
  const textMatch = themeColorIdForHex(theme, theme.bodyTextColor, pool)
  return {
    pageBackgroundColorId: pick(current.pageBackgroundColorId, 'background', bgMatch, pool[2] ?? ''),
    surfaceColorId: pick(current.surfaceColorId, 'surface', pool[3] ?? '', pool[0] ?? ''),
    bodyTextColorId: pick(current.bodyTextColorId, 'text', textMatch, pool[4] ?? '', pool.at(-1) ?? ''),
    accentColor1Id: pick(current.accentColor1Id, 'primary', pool[0] ?? ''),
    accentColor2Id: pick(current.accentColor2Id, 'secondary', pool[1] ?? '', pool[0] ?? ''),
  }
}

export function applyThemeColorRoles(theme: WebsiteTheme, roles: WebsiteThemeColorRoles): WebsiteTheme {
  return {
    ...theme,
    colorRoles: roles,
    pageBackground: resolveThemeColorValue(theme, roles.pageBackgroundColorId, theme.pageBackground),
    bodyTextColor: resolveThemeColorValue(theme, roles.bodyTextColorId, theme.bodyTextColor),
    surfaceColor: resolveThemeColorValue(theme, roles.surfaceColorId, theme.surfaceColor ?? theme.pageBackground),
    accentColor1: resolveThemeColorValue(theme, roles.accentColor1Id, theme.accentColor1 ?? ''),
    accentColor2: resolveThemeColorValue(theme, roles.accentColor2Id, theme.accentColor2 ?? ''),
  }
}

export function themeChromeCssVars(theme: WebsiteTheme | null): CSSProperties {
  if (!theme) return {}
  const resolved = applyThemeColorRoles(theme, inferThemeColorRoles(theme))
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

function chromePatchForTheme(
  theme: WebsiteTheme,
  colors: WebsiteColorToken[],
): Pick<WebsiteTheme, 'pageBackground' | 'bodyTextColor'> {
  const next = { ...theme, colors }
  const roles = inferThemeColorRoles(next)
  if (!THEME_COLOR_ROLE_KEYS.some((key) => roles[key])) {
    return pageChromeFromTokens(colors)
  }
  const applied = applyThemeColorRoles({ ...next, colorRoles: roles }, roles)
  return { pageBackground: applied.pageBackground, bodyTextColor: applied.bodyTextColor }
}

export function normalizeWebsiteTheme(theme: WebsiteTheme): WebsiteTheme {
  const next = {
    ...theme,
    colorPalettes: (theme.colorPalettes ?? []).filter((palette) => palette.id !== THEME_LEGACY_COLORS_PALETTE_ID),
    colorRoles: parseThemeColorRoles(theme.colorRoles),
  }
  return applyThemeColorRoles(next, inferThemeColorRoles(next))
}

export function collectThemeUsedColorIds(theme: WebsiteTheme): Set<string> {
  const roles = parseThemeColorRoles(theme.colorRoles)
  return new Set(
    [
      ...themeColorRoleIds(roles),
      ...theme.textStyles.map((style) => style.colorId),
      ...theme.buttonStyles.flatMap((style) => [
        style.backgroundColorId,
        style.textColorId,
        style.borderColorId,
      ]),
    ].filter(Boolean),
  )
}

export function mergePaletteOntoThemeColors(
  theme: WebsiteTheme,
  swatches: string[],
  names: readonly string[],
): Pick<WebsiteTheme, 'colors' | 'pageBackground' | 'bodyTextColor'> {
  const colors = mergeImportedSwatches(swatches, theme.colors, names, collectThemeUsedColorIds(theme))
  return { colors, ...pageChromeFromTokens(colors) }
}

export function themePaletteRefsToLibraryPalette(
  ref: WebsiteThemeColorPalette,
  colorsById: Map<string, WebsiteColorToken>,
): WebsiteColorLibraryPalette {
  const colors = ref.colorIds
    .map((id) => colorsById.get(id))
    .filter((token): token is WebsiteColorToken => Boolean(token))
    .map((token) => ({ name: token.name, value: token.value }))
  return colors.length > 0 ? { colors } : { colors: [{ name: ref.name, value: '#111827' }] }
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
  const colorsById = new Map(theme.colors.map((color) => [color.id, color]))
  return (theme.colorPalettes ?? []).map((ref) => ({
    id: ref.id,
    name: ref.name,
    palette: themePaletteRefsToLibraryPalette(ref, colorsById),
  }))
}

export function themePaletteColorValues(theme: WebsiteTheme, colorIds: string[]): string[] {
  const paletteId = inferThemePaletteId(theme, colorIds)
  const fromPalette = themeColorOptionsForPalette(theme, paletteId).map((color) => color.swatch)
  if (fromPalette.length > 0) return fromPalette
  return theme.colors.slice(0, 6).map((color) => color.value)
}

export function themeColorOptionsForPalette(theme: WebsiteTheme, paletteId: string): ThemePaletteColorOption[] {
  const ref = (theme.colorPalettes ?? []).find((palette) => palette.id === paletteId)
  if (!ref) return []
  const colorsById = new Map(theme.colors.map((color) => [color.id, color]))
  return ref.colorIds
    .slice(0, 6)
    .map((id) => colorsById.get(id))
    .filter((token): token is WebsiteColorToken => Boolean(token))
    .map((color) => ({
      id: color.id,
      label: `${color.name} (${color.value})`,
      swatch: color.value,
    }))
}

export function inferThemePaletteId(theme: WebsiteTheme, colorIds: string[]): string {
  const palettes = theme.colorPalettes ?? []
  if (palettes.length === 0) return ''
  const ids = colorIds.filter(Boolean)
  const complete = palettes.find((palette) => ids.length > 0 && ids.every((id) => palette.colorIds.includes(id)))
  if (complete) return complete.id
  const partial = palettes.find((palette) => ids.some((id) => palette.colorIds.includes(id)))
  return partial?.id ?? palettes[0]?.id ?? ''
}

export function remapColorIdToPalette(
  theme: WebsiteTheme,
  fromPaletteId: string,
  toPaletteId: string,
  colorId: string,
): string {
  const to = (theme.colorPalettes ?? []).find((palette) => palette.id === toPaletteId)
  if (!to || to.colorIds.length === 0) return ''
  if (to.colorIds.includes(colorId)) return colorId
  const from = (theme.colorPalettes ?? []).find((palette) => palette.id === fromPaletteId)
  const index = from ? from.colorIds.indexOf(colorId) : -1
  return (index >= 0 ? to.colorIds[index] : undefined) ?? to.colorIds[0] ?? ''
}

export function collectThemePaletteColorIds(theme: WebsiteTheme): Set<string> {
  return new Set((theme.colorPalettes ?? []).flatMap((palette) => palette.colorIds))
}

export function pruneThemeColorPalettes(
  colorPalettes: WebsiteThemeColorPalette[],
  removedColorId: string,
): WebsiteThemeColorPalette[] {
  return colorPalettes
    .map((palette) => ({
      ...palette,
      colorIds: palette.colorIds.filter((id) => id !== removedColorId),
    }))
    .filter((palette) => palette.colorIds.length > 0)
}

export function applyLibraryPaletteGroupToTheme(
  theme: WebsiteTheme,
  input: {
    name: string
    sourceLibraryPaletteId: string | null
    entries: Array<{ name: string; value: string }>
  },
): Pick<WebsiteTheme, 'colors' | 'colorPalettes' | 'pageBackground' | 'bodyTextColor'> {
  const normalizedEntries = input.entries.map((entry) => ({
    name: entry.name.trim(),
    value: entry.value.trim().toUpperCase(),
  }))
  const colorPalettes = (theme.colorPalettes ?? []).filter(
    (palette) => palette.id !== THEME_LEGACY_COLORS_PALETTE_ID,
  )
  const paletteRef: WebsiteThemeColorPalette = {
    id: nanoid(8),
    name: input.name.trim(),
    sourceLibraryPaletteId: input.sourceLibraryPaletteId,
    colorIds: [],
  }

  if (colorPalettes.length === 0) {
    const merged = mergePaletteOntoThemeColors(
      { ...theme, colors: [] },
      normalizedEntries.map((entry) => entry.value),
      normalizedEntries.map((entry) => entry.name),
    )
    const leftover = theme.colors.filter((color) => !SLOT_ID_SET.has(color.id))
    const colors = leftover.length > 0 ? [...merged.colors, ...leftover] : merged.colors
    return {
      colors,
      colorPalettes: [
        {
          ...paletteRef,
          colorIds: merged.colors.map((color) => color.id),
        },
      ],
      ...chromePatchForTheme(theme, colors),
    }
  }

  const newTokens = normalizedEntries.map((entry) => ({
    id: nanoid(8),
    name: entry.name,
    value: entry.value,
  }))
  const colors = [...theme.colors, ...newTokens]
  return {
    colors,
    colorPalettes: [
      ...colorPalettes,
      {
        ...paletteRef,
        colorIds: newTokens.map((token) => token.id),
      },
    ],
    ...chromePatchForTheme(theme, colors),
  }
}

export function removeThemeColorPaletteGroup(
  theme: WebsiteTheme,
  paletteInstanceId: string,
): Pick<WebsiteTheme, 'colors' | 'colorPalettes'> {
  const colorPalettes = theme.colorPalettes ?? []
  const palette = colorPalettes.find((item) => item.id === paletteInstanceId)
  if (!palette) {
    return { colors: theme.colors, colorPalettes }
  }
  const usedIds = collectThemeUsedColorIds(theme)
  const otherPaletteColorIds = new Set(
    colorPalettes.filter((item) => item.id !== paletteInstanceId).flatMap((item) => item.colorIds),
  )
  const removeColorIds = new Set(
    palette.colorIds.filter((id) => !usedIds.has(id) && !otherPaletteColorIds.has(id)),
  )
  return {
    colors: theme.colors.filter((color) => !removeColorIds.has(color.id)),
    colorPalettes: colorPalettes.filter((item) => item.id !== paletteInstanceId),
  }
}

export function appendLibraryPaletteToTheme(
  theme: WebsiteTheme,
  entries: Array<{ name: string; value: string }>,
): Pick<WebsiteTheme, 'colors' | 'pageBackground' | 'bodyTextColor'> {
  const normalizedEntries = entries.map((entry) => ({
    name: entry.name.trim(),
    value: entry.value.trim().toUpperCase(),
  }))
  const onTheme = new Set(theme.colors.map((color) => color.value.trim().toLowerCase()))
  const toAdd = normalizedEntries.filter((entry) => !onTheme.has(entry.value.toLowerCase()))
  if (toAdd.length === 0) {
    return { colors: theme.colors, ...chromePatchForTheme(theme, theme.colors) }
  }
  if (theme.colors.length === 0) {
    return mergePaletteOntoThemeColors(
      theme,
      toAdd.map((entry) => entry.value),
      toAdd.map((entry) => entry.name),
    )
  }
  const colors = [
    ...theme.colors,
    ...toAdd.map((entry) => ({ id: nanoid(8), name: entry.name, value: entry.value })),
  ]
  return { colors, ...chromePatchForTheme(theme, colors) }
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

