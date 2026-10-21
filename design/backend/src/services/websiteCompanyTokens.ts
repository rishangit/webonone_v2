import type { Knex } from 'knex'
import type {
  WebsiteButtonStyle,
  WebsiteFontToken,
  WebsiteTextStyle,
  WebsiteThemeColorPalette,
} from '../schemas/websiteThemes.schema.js'
import {
  COMPANY_TOKEN_TABLE,
  LIBRARY_TOKEN_TABLE,
  classifyTokenColumn,
  companyTokenInsert,
  companyTokenUpdate,
  hydrateCompanyTokenRows,
  planCompanyThemeTokens,
  type HydratedThemeTokens,
  type TokenKind,
  type TokenRemap,
} from '../utils/companyThemeTokens.js'
import { nanoid } from 'nanoid'

type Sql = Knex | Knex.Transaction

export type CompanyThemeTokenInput = {
  companyId: string
  userId: string | null
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
}

export type StoredCompanyThemeTokens = {
  fontIds: string[]
  paletteIds: string[]
  textStyleIds: string[]
  buttonStyleIds: string[]
  colorPaletteId: string | null
  remap: TokenRemap
}

export async function storeCompanyThemeTokens(conn: Sql, input: CompanyThemeTokenInput): Promise<StoredCompanyThemeTokens> {
  const ids = {
    font: unique([
      ...input.fonts.map((item) => item.id),
      ...(input.currentIds?.fontIds ?? []),
    ]),
    color: unique([
      ...input.colorPalettes.map((item) => item.id),
      ...(input.currentIds?.paletteIds ?? []),
    ]),
    text: unique([
      ...input.textStyles.map((item) => item.id),
      ...(input.currentIds?.textStyleIds ?? []),
    ]),
    button: unique([
      ...input.buttonStyles.map((item) => item.id),
      ...(input.currentIds?.buttonStyleIds ?? []),
    ]),
  }
  const [owned, takenIds, reservedNames, libraryIds] = await Promise.all([
    loadOwned(conn, input.companyId, ids),
    loadTaken(conn, ids),
    loadNames(conn, input.companyId),
    loadLibraryIds(conn, {
      font: input.fonts.flatMap((item) => (item.sourceLibraryId ? [item.sourceLibraryId] : [])),
      color: input.colorPalettes.flatMap((item) => (item.sourceLibraryPaletteId ? [item.sourceLibraryPaletteId] : [])),
      text: input.textStyles.flatMap((item) => (item.sourceLibraryId ? [item.sourceLibraryId] : [])),
      button: input.buttonStyles.flatMap((item) => (item.sourceLibraryId ? [item.sourceLibraryId] : [])),
    }),
  ])
  const planned = planCompanyThemeTokens({
    align: input.align,
    fonts: input.fonts,
    colorPalettes: input.colorPalettes,
    textStyles: input.textStyles,
    buttonStyles: input.buttonStyles,
    colorPaletteId: input.colorPaletteId,
    currentIds: input.currentIds,
    owned,
    takenIds,
    reservedNames,
    libraryIds,
    createId: () => nanoid(),
  })
  for (const write of planned.writes) {
    if (write.mode === 'insert') {
      await conn(COMPANY_TOKEN_TABLE[write.kind]).insert({
        ...companyTokenInsert(write, input.companyId, input.userId),
        created_at: conn.fn.now(3),
        updated_at: conn.fn.now(3),
      })
    } else {
      await conn(COMPANY_TOKEN_TABLE[write.kind])
        .where({ id: write.id, company_id: input.companyId })
        .update({ ...companyTokenUpdate(write), updated_at: conn.fn.now(3) })
    }
  }
  return {
    fontIds: planned.fontIds,
    paletteIds: planned.paletteIds,
    textStyleIds: planned.textStyleIds,
    buttonStyleIds: planned.buttonStyleIds,
    colorPaletteId: planned.colorPaletteId,
    remap: planned.remap,
  }
}

export async function readCompanyThemeTokens(
  conn: Sql,
  companyId: string,
  rows: Array<{
    id: string
    fonts: unknown
    color_palettes: unknown
    text_styles: unknown
    button_styles: unknown
  }>,
): Promise<Map<string, HydratedThemeTokens>> {
  const parsed = rows.map((row) => ({
    id: row.id,
    fonts: classifyTokenColumn(row.fonts),
    colors: classifyTokenColumn(row.color_palettes),
    texts: classifyTokenColumn(row.text_styles),
    buttons: classifyTokenColumn(row.button_styles),
  }))
  const ids = {
    font: unique(parsed.flatMap((row) => (row.fonts.kind === 'ids' ? row.fonts.ids : []))),
    color: unique(parsed.flatMap((row) => (row.colors.kind === 'ids' ? row.colors.ids : []))),
    text: unique(parsed.flatMap((row) => (row.texts.kind === 'ids' ? row.texts.ids : []))),
    button: unique(parsed.flatMap((row) => (row.buttons.kind === 'ids' ? row.buttons.ids : []))),
  }
  const [fonts, colors, texts, buttons] = await Promise.all([
    loadFontRows(conn, companyId, ids.font),
    loadColorRows(conn, companyId, ids.color),
    loadDefinitionRows(conn, companyId, 'text', ids.text),
    loadDefinitionRows(conn, companyId, 'button', ids.button),
  ])
  const hydrated = new Map<string, HydratedThemeTokens>()
  for (const row of parsed) {
    const fromRows = hydrateCompanyTokenRows({
      fontIds: row.fonts.kind === 'ids' ? row.fonts.ids : [],
      paletteIds: row.colors.kind === 'ids' ? row.colors.ids : [],
      textStyleIds: row.texts.kind === 'ids' ? row.texts.ids : [],
      buttonStyleIds: row.buttons.kind === 'ids' ? row.buttons.ids : [],
      fonts,
      colors,
      texts,
      buttons,
    })
    hydrated.set(row.id, {
      fonts: row.fonts.kind === 'embedded' ? (row.fonts.items as WebsiteFontToken[]) : fromRows.fonts,
      colorPalettes: row.colors.kind === 'embedded' ? (row.colors.items as WebsiteThemeColorPalette[]) : fromRows.colorPalettes,
      textStyles: row.texts.kind === 'embedded' ? (row.texts.items as WebsiteTextStyle[]) : fromRows.textStyles,
      buttonStyles: row.buttons.kind === 'embedded' ? (row.buttons.items as WebsiteButtonStyle[]) : fromRows.buttonStyles,
    })
  }
  return hydrated
}

export async function deleteUnsharedThemeTokens(
  conn: Sql,
  input: { companyId: string; themeId: string; fontIds: string[]; paletteIds: string[]; textStyleIds: string[]; buttonStyleIds: string[] },
): Promise<void> {
  const others = await conn('design_website_themes')
    .where({ company_id: input.companyId })
    .whereNot({ id: input.themeId })
    .select('fonts', 'color_palettes', 'text_styles', 'button_styles')
  const used = {
    font: new Set<string>(),
    color: new Set<string>(),
    text: new Set<string>(),
    button: new Set<string>(),
  }
  for (const row of others) {
    collectIds(used.font, row.fonts)
    collectIds(used.color, row.color_palettes)
    collectIds(used.text, row.text_styles)
    collectIds(used.button, row.button_styles)
  }
  await deleteOwned(conn, 'font', input.companyId, input.fontIds.filter((id) => !used.font.has(id)))
  await deleteOwned(conn, 'color', input.companyId, input.paletteIds.filter((id) => !used.color.has(id)))
  await deleteOwned(conn, 'text', input.companyId, input.textStyleIds.filter((id) => !used.text.has(id)))
  await deleteOwned(conn, 'button', input.companyId, input.buttonStyleIds.filter((id) => !used.button.has(id)))
}

async function loadOwned(conn: Sql, companyId: string, ids: Record<TokenKind, string[]>) {
  const [font, color, text, button] = await Promise.all([
    loadIdNames(conn, 'font', ids.font, companyId),
    loadIdNames(conn, 'color', ids.color, companyId),
    loadIdNames(conn, 'text', ids.text, companyId),
    loadIdNames(conn, 'button', ids.button, companyId),
  ])
  return { font, color, text, button }
}

async function loadTaken(conn: Sql, ids: Record<TokenKind, string[]>) {
  const [font, color, text, button] = await Promise.all([
    loadAnyIds(conn, 'font', ids.font),
    loadAnyIds(conn, 'color', ids.color),
    loadAnyIds(conn, 'text', ids.text),
    loadAnyIds(conn, 'button', ids.button),
  ])
  return { font, color, text, button }
}

async function loadNames(conn: Sql, companyId: string) {
  const [font, color, text, button] = await Promise.all([
    loadCompanyNames(conn, 'font', companyId),
    loadCompanyNames(conn, 'color', companyId),
    loadCompanyNames(conn, 'text', companyId),
    loadCompanyNames(conn, 'button', companyId),
  ])
  return { font, color, text, button }
}

async function loadLibraryIds(conn: Sql, ids: Record<TokenKind, string[]>) {
  const [font, color, text, button] = await Promise.all([
    loadLibraryIdSet(conn, 'font', ids.font),
    loadLibraryIdSet(conn, 'color', ids.color),
    loadLibraryIdSet(conn, 'text', ids.text),
    loadLibraryIdSet(conn, 'button', ids.button),
  ])
  return { font, color, text, button }
}

async function loadIdNames(conn: Sql, kind: TokenKind, ids: string[], companyId: string): Promise<Array<{ id: string; name: string }>> {
  if (ids.length === 0) return []
  const rows = await conn(COMPANY_TOKEN_TABLE[kind]).whereIn('id', ids).andWhere({ company_id: companyId }).select('id', 'name')
  return rows.map((row: { id: string; name: string }) => ({ id: row.id, name: row.name }))
}

async function loadAnyIds(conn: Sql, kind: TokenKind, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const rows = await conn(COMPANY_TOKEN_TABLE[kind]).whereIn('id', ids).select('id')
  return new Set(rows.map((row: { id: string }) => row.id))
}

async function loadCompanyNames(conn: Sql, kind: TokenKind, companyId: string): Promise<string[]> {
  const rows = await conn(COMPANY_TOKEN_TABLE[kind]).where({ company_id: companyId }).select('name')
  return rows.map((row: { name: string }) => row.name)
}

async function loadLibraryIdSet(conn: Sql, kind: TokenKind, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const rows = await conn(LIBRARY_TOKEN_TABLE[kind]).whereIn('id', ids).select('id')
  return new Set(rows.map((row: { id: string }) => row.id))
}

async function loadFontRows(conn: Sql, companyId: string, ids: string[]) {
  if (ids.length === 0) return []
  return conn(COMPANY_TOKEN_TABLE.font)
    .where({ company_id: companyId })
    .whereIn('id', ids)
    .select('id', 'name', 'google_font_url', 'family', 'source_library_id')
}

async function loadColorRows(conn: Sql, companyId: string, ids: string[]) {
  if (ids.length === 0) return []
  return conn(COMPANY_TOKEN_TABLE.color)
    .where({ company_id: companyId })
    .whereIn('id', ids)
    .select('id', 'name', 'palette', 'source_library_id')
}

async function loadDefinitionRows(conn: Sql, companyId: string, kind: 'text' | 'button', ids: string[]) {
  if (ids.length === 0) return []
  return conn(COMPANY_TOKEN_TABLE[kind])
    .where({ company_id: companyId })
    .whereIn('id', ids)
    .select('id', 'name', 'definition', 'source_library_id')
}

async function deleteOwned(conn: Sql, kind: TokenKind, companyId: string, ids: string[]) {
  if (ids.length === 0) return
  await conn(COMPANY_TOKEN_TABLE[kind]).where({ company_id: companyId }).whereIn('id', ids).del()
}

function collectIds(target: Set<string>, raw: unknown) {
  const column = classifyTokenColumn(raw)
  if (column.kind === 'ids') {
    for (const id of column.ids) target.add(id)
  }
}

function unique(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => id.trim()))]
}
