import type {
  WebsiteButtonStyle,
  WebsiteFontToken,
  WebsiteTextStyle,
  WebsiteThemeColorPalette,
} from '../schemas/websiteThemes.schema.js'

export const COMPANY_TOKEN_TABLE = {
  color: 'design_website_color',
  button: 'design_website_button',
  font: 'design_website_font',
  text: 'design_website_text',
} as const

export const LIBRARY_TOKEN_TABLE = {
  color: 'design_website_library_color',
  button: 'design_website_library_button',
  font: 'design_website_library_font',
  text: 'design_website_library_text',
} as const

export type TokenKind = keyof typeof COMPANY_TOKEN_TABLE

export type TokenRemap = {
  text: Record<string, string>
  button: Record<string, string>
  color?: Record<string, string>
}

export type TokenWrite = {
  kind: TokenKind
  id: string
  mode: 'insert' | 'update'
  sourceLibraryId: string | null
  name: string
  sortOrder: number
  palette?: { colors: Array<{ name: string; value: string }> }
  definition?: Record<string, unknown>
  googleFontUrl?: string
  family?: string
}

export type PlannedCompanyTokens = {
  writes: TokenWrite[]
  fontIds: string[]
  paletteIds: string[]
  textStyleIds: string[]
  buttonStyleIds: string[]
  colorPaletteId: string | null
  remap: TokenRemap
}

export type OwnedToken = { id: string; name: string }

type IdSets = Record<TokenKind, Set<string>>
type NameLists = Record<TokenKind, string[]>
type OwnedLists = Record<TokenKind, OwnedToken[]>

export type CompanyTokenPlanInput = {
  align: 'id' | 'index'
  fonts: WebsiteFontToken[]
  colorPalettes: WebsiteThemeColorPalette[]
  textStyles: WebsiteTextStyle[]
  buttonStyles: WebsiteButtonStyle[]
  colorPaletteId: string | null
  currentIds?: {
    fontIds: string[]
    paletteIds: string[]
    textStyleIds: string[]
    buttonStyleIds: string[]
  }
  owned: OwnedLists
  takenIds: IdSets
  reservedNames: NameLists
  libraryIds: IdSets
  createId: () => string
}

export function companyItemSource(libraryId?: string | null): string | null {
  const value = libraryId?.trim()
  return value ? value : null
}

export function classifyTokenColumn(raw: unknown): { kind: 'ids'; ids: string[] } | { kind: 'embedded'; items: unknown[] } {
  const value = parseJson(raw)
  if (!Array.isArray(value)) return { kind: 'ids', ids: [] }
  if (value.every((item) => typeof item === 'string')) return { kind: 'ids', ids: value }
  return { kind: 'embedded', items: value }
}

export function planCompanyThemeTokens(input: CompanyTokenPlanInput): PlannedCompanyTokens {
  const taken = copySets(input.takenIds)
  const reserved = reserveNames(input.reservedNames)
  const owned = {
    font: new Map(input.owned.font.map((row) => [row.id, row.name])),
    color: new Map(input.owned.color.map((row) => [row.id, row.name])),
    text: new Map(input.owned.text.map((row) => [row.id, row.name])),
    button: new Map(input.owned.button.map((row) => [row.id, row.name])),
  }
  const current = input.currentIds ?? { fontIds: [], paletteIds: [], textStyleIds: [], buttonStyleIds: [] }

  const fonts = assignGroup(input.fonts, 'font', current.fontIds)
  const palettes = assignGroup(input.colorPalettes, 'color', current.paletteIds)
  const texts = assignGroup(input.textStyles, 'text', current.textStyleIds)
  const buttons = assignGroup(input.buttonStyles, 'button', current.buttonStyleIds)
  const fontMap = Object.fromEntries(fonts.map((item) => [item.source.id, item.id]))
  const paletteMap = Object.fromEntries(palettes.map((item) => [item.source.id, item.id]))
  const textMap = Object.fromEntries(texts.map((item) => [item.source.id, item.id]))
  const buttonMap = Object.fromEntries(buttons.map((item) => [item.source.id, item.id]))

  const writes: TokenWrite[] = [
    ...fonts.map((item, index) =>
      fontWrite(item, index, reserved.font, owned.font, input.libraryIds.font),
    ),
    ...palettes.map((item, index) =>
      colorWrite(item, index, reserved.color, owned.color, input.libraryIds.color),
    ),
    ...texts.map((item, index) =>
      textWrite(item, index, reserved.text, owned.text, input.libraryIds.text, fontMap, paletteMap),
    ),
    ...buttons.map((item, index) =>
      buttonWrite(item, index, reserved.button, owned.button, input.libraryIds.button, textMap, paletteMap),
    ),
  ]

  return {
    writes,
    fontIds: fonts.map((item) => item.id),
    paletteIds: palettes.map((item) => item.id),
    textStyleIds: texts.map((item) => item.id),
    buttonStyleIds: buttons.map((item) => item.id),
    colorPaletteId: remapId(input.colorPaletteId, paletteMap),
    remap: { text: textMap, button: buttonMap, color: paletteMap },
  }

  function assignGroup<T extends { id: string }>(items: T[], kind: TokenKind, currentIds: string[]) {
    return items.map((source, index) => {
      const id = assignId(kind, source.id, currentIds[index])
      taken[kind].add(id)
      return { source, id, mode: owned[kind].has(id) ? ('update' as const) : ('insert' as const) }
    })
  }

  function assignId(kind: TokenKind, incomingId: string, currentId: string | undefined): string {
    if (input.align === 'index' && currentId && owned[kind].has(currentId)) return currentId
    if (input.align === 'id' && owned[kind].has(incomingId)) return incomingId
    if (!taken[kind].has(incomingId)) return incomingId
    let id = input.createId()
    while (taken[kind].has(id)) id = input.createId()
    return id
  }
}

export function companyTokenInsert(write: TokenWrite, companyId: string, userId: string | null): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: write.id,
    company_id: companyId,
    name: write.name,
    sort_order: write.sortOrder,
    source_library_id: write.sourceLibraryId,
    created_by: userId,
  }
  return { ...row, ...payloadColumns(write) }
}

export function companyTokenUpdate(write: TokenWrite): Record<string, unknown> {
  return { name: write.name, sort_order: write.sortOrder, ...payloadColumns(write) }
}

export function remapDocumentTokenIds<T>(value: T, remap: TokenRemap): T {
  return remapValue(value, remap) as T
}

export type HydratedThemeTokens = {
  fonts: WebsiteFontToken[]
  colorPalettes: WebsiteThemeColorPalette[]
  textStyles: WebsiteTextStyle[]
  buttonStyles: WebsiteButtonStyle[]
}

export function hydrateCompanyTokenRows(input: {
  fontIds: string[]
  paletteIds: string[]
  textStyleIds: string[]
  buttonStyleIds: string[]
  fonts: Array<{ id: string; name: string; google_font_url: string; family: string; source_library_id: string | null }>
  colors: Array<{ id: string; name: string; palette: unknown; source_library_id: string | null }>
  texts: Array<{ id: string; name: string; definition: unknown; source_library_id: string | null }>
  buttons: Array<{ id: string; name: string; definition: unknown; source_library_id: string | null }>
}): HydratedThemeTokens {
  const fonts = new Map(input.fonts.map((row) => [row.id, row]))
  const colors = new Map(input.colors.map((row) => [row.id, row]))
  const texts = new Map(input.texts.map((row) => [row.id, row]))
  const buttons = new Map(input.buttons.map((row) => [row.id, row]))
  return {
    fonts: input.fontIds.flatMap((id) => {
      const row = fonts.get(id)
      if (!row) return []
      return [{ id: row.id, name: row.name, googleFontUrl: row.google_font_url, family: row.family, sourceLibraryId: row.source_library_id }]
    }),
    colorPalettes: input.paletteIds.flatMap((id) => {
      const row = colors.get(id)
      if (!row) return []
      return [{ id: row.id, name: row.name, sourceLibraryPaletteId: row.source_library_id, colors: paletteColors(row.palette) }]
    }),
    textStyles: input.textStyleIds.flatMap((id) => {
      const row = texts.get(id)
      if (!row) return []
      return [{ ...definitionRecord(row.definition), id: row.id, name: row.name, sourceLibraryId: row.source_library_id } as WebsiteTextStyle]
    }),
    buttonStyles: input.buttonStyleIds.flatMap((id) => {
      const row = buttons.get(id)
      if (!row) return []
      return [{ ...definitionRecord(row.definition), id: row.id, name: row.name, sourceLibraryId: row.source_library_id } as WebsiteButtonStyle]
    }),
  }
}

function payloadColumns(write: TokenWrite): Record<string, unknown> {
  if (write.kind === 'color') return { palette: JSON.stringify(write.palette ?? { colors: [] }) }
  if (write.kind === 'font') return { google_font_url: write.googleFontUrl ?? '', family: write.family ?? write.name }
  return { definition: JSON.stringify(write.definition ?? {}) }
}

function fontWrite(
  item: { source: WebsiteFontToken; id: string; mode: 'insert' | 'update' },
  index: number,
  reserved: Set<string>,
  owned: Map<string, string>,
  libraryIds: Set<string>,
): TokenWrite {
  return baseWrite('font', item, index, reserved, owned, libraryIds, item.source.sourceLibraryId, {
    googleFontUrl: item.source.googleFontUrl,
    family: item.source.family,
  })
}

function colorWrite(
  item: { source: WebsiteThemeColorPalette; id: string; mode: 'insert' | 'update' },
  index: number,
  reserved: Set<string>,
  owned: Map<string, string>,
  libraryIds: Set<string>,
): TokenWrite {
  return baseWrite('color', item, index, reserved, owned, libraryIds, item.source.sourceLibraryPaletteId, {
    palette: { colors: item.source.colors.map((color) => ({ name: color.name, value: color.value })) },
  })
}

function textWrite(
  item: { source: WebsiteTextStyle; id: string; mode: 'insert' | 'update' },
  index: number,
  reserved: Set<string>,
  owned: Map<string, string>,
  libraryIds: Set<string>,
  fontMap: Record<string, string>,
  paletteMap: Record<string, string>,
): TokenWrite {
  const { id: _id, name: _name, sourceLibraryId: _source, ...definition } = item.source
  return baseWrite('text', item, index, reserved, owned, libraryIds, item.source.sourceLibraryId, {
    definition: {
      ...definition,
      fontId: remapId(item.source.fontId, fontMap) ?? '',
      colorPaletteId: remapId(item.source.colorPaletteId, paletteMap),
    },
  })
}

function buttonWrite(
  item: { source: WebsiteButtonStyle; id: string; mode: 'insert' | 'update' },
  index: number,
  reserved: Set<string>,
  owned: Map<string, string>,
  libraryIds: Set<string>,
  textMap: Record<string, string>,
  paletteMap: Record<string, string>,
): TokenWrite {
  const { id: _id, name: _name, sourceLibraryId: _source, ...definition } = item.source
  return baseWrite('button', item, index, reserved, owned, libraryIds, item.source.sourceLibraryId, {
    definition: {
      ...definition,
      textStyleId: remapId(item.source.textStyleId, textMap) ?? '',
      colorPaletteId: remapId(item.source.colorPaletteId, paletteMap),
    },
  })
}

function baseWrite(
  kind: TokenKind,
  item: { source: { name: string }; id: string; mode: 'insert' | 'update' },
  index: number,
  reserved: Set<string>,
  owned: Map<string, string>,
  libraryIds: Set<string>,
  sourceLibraryId: string | null | undefined,
  extra: Partial<TokenWrite>,
): TokenWrite {
  if (item.mode === 'update') {
    const current = owned.get(item.id)
    if (current) reserved.delete(current.toLowerCase())
  }
  const sourceId = companyItemSource(sourceLibraryId)
  return {
    kind,
    id: item.id,
    mode: item.mode,
    sourceLibraryId: item.mode === 'insert' && sourceId && libraryIds.has(sourceId) ? sourceId : null,
    name: nextTokenName(reserved, item.source.name),
    sortOrder: index,
    ...extra,
  }
}

function nextTokenName(reserved: Set<string>, name: string): string {
  const base = (name.trim() || 'Item').slice(0, 128)
  if (!reserved.has(base.toLowerCase())) {
    reserved.add(base.toLowerCase())
    return base
  }
  for (let n = 1; n < 40; n += 1) {
    const suffix = n === 1 ? ' copy' : ` copy ${n}`
    const candidate = `${base.slice(0, Math.max(1, 128 - suffix.length))}${suffix}`
    if (!reserved.has(candidate.toLowerCase())) {
      reserved.add(candidate.toLowerCase())
      return candidate
    }
  }
  throw new Error('Could not choose a unique name')
}

function remapId(id: string | null | undefined, map: Record<string, string>): string | null {
  if (!id) return null
  return map[id] ?? id
}

function remapValue(value: unknown, remap: TokenRemap): unknown {
  if (Array.isArray(value)) return value.map((item) => remapValue(item, remap))
  if (!value || typeof value !== 'object') return value
  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'textStyleId' && typeof child === 'string') next[key] = remap.text[child] ?? child
    else if (key === 'buttonStyleId' && typeof child === 'string') next[key] = remap.button[child] ?? child
    else if (key === 'colorPaletteId' && typeof child === 'string') next[key] = remap.color?.[child] ?? child
    else next[key] = remapValue(child, remap)
  }
  return next
}

function reserveNames(names: NameLists): Record<TokenKind, Set<string>> {
  return {
    font: new Set(names.font.map((name) => name.toLowerCase())),
    color: new Set(names.color.map((name) => name.toLowerCase())),
    text: new Set(names.text.map((name) => name.toLowerCase())),
    button: new Set(names.button.map((name) => name.toLowerCase())),
  }
}

function copySets(sets: IdSets): IdSets {
  return {
    font: new Set(sets.font),
    color: new Set(sets.color),
    text: new Set(sets.text),
    button: new Set(sets.button),
  }
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function paletteColors(raw: unknown): Array<{ name: string; value: string }> {
  const value = parseJson(raw)
  if (!value || typeof value !== 'object' || !Array.isArray((value as { colors?: unknown }).colors)) return []
  return (value as { colors: unknown[] }).colors.flatMap((color) => {
    if (!color || typeof color !== 'object') return []
    const record = color as { name?: unknown; value?: unknown }
    if (typeof record.value !== 'string') return []
    return [{ name: typeof record.name === 'string' && record.name.trim() ? record.name : 'Color', value: record.value }]
  })
}

function definitionRecord(raw: unknown): Record<string, unknown> {
  const value = parseJson(raw)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}
