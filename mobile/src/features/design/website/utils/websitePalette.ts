import { PLATFORM_DEFAULT_THEME, themeDtoToColors } from '@webonone/theme'
import type { WebsiteColorToken } from '../types'

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

export const WEBSITE_PALETTE_IMPORT_EMBED_PATH = '/embed/dialogs/website/themes/import-palette'

export const WEBSITE_THEME_CREATE_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

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

export type WebsiteThemeCreateValues = {
  name: string
  colors: WebsiteColorToken[]
  pageBackground: string
  bodyTextColor: string
}

export function createNestedRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `palette-import-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
