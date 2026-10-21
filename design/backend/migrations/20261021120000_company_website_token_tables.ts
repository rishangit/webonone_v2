import type { Knex } from 'knex'
import { nanoid } from 'nanoid'
import type {
  WebsiteButtonStyle,
  WebsiteFontToken,
  WebsiteTextStyle,
  WebsiteThemeColorPalette,
} from '../src/schemas/websiteThemes.schema.js'
import {
  COMPANY_TOKEN_TABLE,
  LIBRARY_TOKEN_TABLE,
  classifyTokenColumn,
  companyTokenInsert,
  hydrateCompanyTokenRows,
  planCompanyThemeTokens,
  remapDocumentTokenIds,
  type TokenKind,
  type TokenRemap,
} from '../src/utils/companyThemeTokens.js'

const COMPANY_TABLES = Object.values(COMPANY_TOKEN_TABLE)

export async function up(knex: Knex): Promise<void> {
  const hasText = await knex.schema.hasTable('design_website_text_library')
  const hasRenamed = await knex.schema.hasTable('design_website_library_text')
  if (hasText && !hasRenamed) await knex.schema.renameTable('design_website_text_library', 'design_website_library_text')

  if (!(await knex.schema.hasTable(COMPANY_TOKEN_TABLE.color))) {
    await knex.schema.createTable(COMPANY_TOKEN_TABLE.color, (table) => {
      tokenColumns(knex, table, LIBRARY_TOKEN_TABLE.color)
      table.json('palette').notNullable()
      table.unique(['company_id', 'name'], { indexName: 'uq_design_website_color_company_name' })
      table.index(['company_id'], 'idx_design_website_color_company')
    })
  }
  if (!(await knex.schema.hasTable(COMPANY_TOKEN_TABLE.button))) {
    await knex.schema.createTable(COMPANY_TOKEN_TABLE.button, (table) => {
      tokenColumns(knex, table, LIBRARY_TOKEN_TABLE.button)
      table.json('definition').notNullable()
      table.unique(['company_id', 'name'], { indexName: 'uq_design_website_button_company_name' })
      table.index(['company_id'], 'idx_design_website_button_company')
    })
  }
  if (!(await knex.schema.hasTable(COMPANY_TOKEN_TABLE.font))) {
    await knex.schema.createTable(COMPANY_TOKEN_TABLE.font, (table) => {
      tokenColumns(knex, table, LIBRARY_TOKEN_TABLE.font)
      table.string('google_font_url', 2048).notNullable()
      table.string('family', 255).notNullable()
      table.unique(['company_id', 'name'], { indexName: 'uq_design_website_font_company_name' })
      table.index(['company_id'], 'idx_design_website_font_company')
    })
  }
  if (!(await knex.schema.hasTable(COMPANY_TOKEN_TABLE.text))) {
    await knex.schema.createTable(COMPANY_TOKEN_TABLE.text, (table) => {
      tokenColumns(knex, table, LIBRARY_TOKEN_TABLE.text)
      table.json('definition').notNullable()
      table.unique(['company_id', 'name'], { indexName: 'uq_design_website_text_company_name' })
      table.index(['company_id'], 'idx_design_website_text_company')
    })
  }

  if (await knex.schema.hasTable('design_website_themes')) await backfillCompanyThemes(knex)
}

export async function down(knex: Knex): Promise<void> {
  if ((await knex.schema.hasTable('design_website_themes')) && (await knex.schema.hasTable(COMPANY_TOKEN_TABLE.color))) {
    await restoreEmbeddedThemes(knex)
  }
  for (const table of [...COMPANY_TABLES].reverse()) {
    await knex.schema.dropTableIfExists(table)
  }
  const hasText = await knex.schema.hasTable('design_website_library_text')
  const hasOld = await knex.schema.hasTable('design_website_text_library')
  if (hasText && !hasOld) await knex.schema.renameTable('design_website_library_text', 'design_website_text_library')
}

function tokenColumns(knex: Knex, table: Knex.CreateTableBuilder, libraryTable: string) {
  table.string('id', 64).primary()
  table.string('company_id', 21).notNullable()
  table.string('name', 128).notNullable()
  table.integer('sort_order').notNullable().defaultTo(0)
  table.string('source_library_id', 64).nullable()
  table.foreign('source_library_id').references('id').inTable(libraryTable).onDelete('SET NULL')
  table.string('created_by', 21).nullable()
  table.datetime('created_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
  table.datetime('updated_at', { precision: 3 }).notNullable().defaultTo(knex.fn.now(3))
}

async function backfillCompanyThemes(knex: Knex): Promise<void> {
  const themes = await knex('design_website_themes').select('*')
  const layouts = (await knex.schema.hasTable('design_website_layouts'))
    ? await knex('design_website_layouts').select('id', 'company_id', 'theme_id', 'header_id', 'footer_id')
    : []
  const taken = emptySets()
  const reserved = new Map<string, Record<TokenKind, string[]>>()
  const presetsDone = new Set<string>()
  const chromeDone = new Set<string>()
  const libraryIds = {
    font: await idSet(knex, LIBRARY_TOKEN_TABLE.font),
    color: await idSet(knex, LIBRARY_TOKEN_TABLE.color),
    text: await idSet(knex, LIBRARY_TOKEN_TABLE.text),
    button: await idSet(knex, LIBRARY_TOKEN_TABLE.button),
  }

  for (const theme of themes) {
    const fonts = classifyTokenColumn(theme.fonts)
    const colors = classifyTokenColumn(theme.color_palettes)
    const texts = classifyTokenColumn(theme.text_styles)
    const buttons = classifyTokenColumn(theme.button_styles)
    const embedded = [fonts, colors, texts, buttons].some((column) => column.kind === 'embedded')
    if (!embedded) {
      if (fonts.kind === 'ids') for (const id of fonts.ids) taken.font.add(id)
      if (colors.kind === 'ids') for (const id of colors.ids) taken.color.add(id)
      if (texts.kind === 'ids') for (const id of texts.ids) taken.text.add(id)
      if (buttons.kind === 'ids') for (const id of buttons.ids) taken.button.add(id)
      continue
    }
    const companyId = String(theme.company_id)
    const names = reserved.get(companyId) ?? { font: [], color: [], text: [], button: [] }
    const planned = planCompanyThemeTokens({
      align: 'id',
      fonts: fonts.kind === 'embedded' ? (fonts.items as WebsiteFontToken[]) : [],
      colorPalettes: colors.kind === 'embedded' ? (colors.items as WebsiteThemeColorPalette[]) : [],
      textStyles: texts.kind === 'embedded' ? (texts.items as WebsiteTextStyle[]) : [],
      buttonStyles: buttons.kind === 'embedded' ? (buttons.items as WebsiteButtonStyle[]) : [],
      colorPaletteId: typeof theme.color_palette_id === 'string' ? theme.color_palette_id : null,
      owned: { font: [], color: [], text: [], button: [] },
      takenIds: {
        font: new Set(taken.font),
        color: new Set(taken.color),
        text: new Set(taken.text),
        button: new Set(taken.button),
      },
      reservedNames: names,
      libraryIds,
      createId: () => nanoid(),
    })
    for (const write of planned.writes) {
      await knex(COMPANY_TOKEN_TABLE[write.kind]).insert({
        ...companyTokenInsert(write, companyId, typeof theme.created_by === 'string' ? theme.created_by : null),
        created_at: knex.fn.now(3),
        updated_at: knex.fn.now(3),
      })
      names[write.kind].push(write.name)
      taken[write.kind].add(write.id)
    }
    reserved.set(companyId, names)
    await knex('design_website_themes').where({ id: theme.id }).update({
      color_palette_id: colors.kind === 'embedded' ? planned.colorPaletteId : theme.color_palette_id,
      fonts: JSON.stringify(fonts.kind === 'ids' ? fonts.ids : planned.fontIds),
      color_palettes: JSON.stringify(colors.kind === 'ids' ? colors.ids : planned.paletteIds),
      text_styles: JSON.stringify(texts.kind === 'ids' ? texts.ids : planned.textStyleIds),
      button_styles: JSON.stringify(buttons.kind === 'ids' ? buttons.ids : planned.buttonStyleIds),
    })
    await remapThemeDocuments(knex, {
      companyId,
      themeId: String(theme.id),
      remap: planned.remap,
      layouts,
      presetsDone,
      chromeDone,
    })
  }
}

async function remapThemeDocuments(
  knex: Knex,
  input: {
    companyId: string
    themeId: string
    remap: TokenRemap
    layouts: Array<{ id: string; company_id: string; theme_id: string | null; header_id: string | null; footer_id: string | null }>
    presetsDone: Set<string>
    chromeDone: Set<string>
  },
) {
  const layouts = input.layouts.filter((layout) => layout.theme_id === input.themeId && layout.company_id === input.companyId)
  const layoutIds = layouts.map((layout) => layout.id)
  if (layoutIds.length > 0 && (await knex.schema.hasTable('design_website_pages'))) {
    const pages = await knex('design_website_pages').where({ company_id: input.companyId }).whereIn('layout_id', layoutIds)
    for (const page of pages) {
      await knex('design_website_pages').where({ id: page.id }).update({
        document: JSON.stringify(remapDocumentTokenIds(parseJson(page.document), input.remap)),
      })
    }
  }
  for (const layout of layouts) {
    if (layout.header_id) await remapChrome(knex, 'design_website_headers', layout.header_id, input.remap, input.chromeDone)
    if (layout.footer_id) await remapChrome(knex, 'design_website_footers', layout.footer_id, input.remap, input.chromeDone)
  }
  if (!input.presetsDone.has(input.companyId) && (await knex.schema.hasTable('design_website_presets'))) {
    input.presetsDone.add(input.companyId)
    const presets = await knex('design_website_presets').where({ company_id: input.companyId })
    for (const preset of presets) {
      await knex('design_website_presets').where({ id: preset.id }).update({
        document: JSON.stringify(remapDocumentTokenIds(parseJson(preset.document), input.remap)),
      })
    }
  }
}

async function remapChrome(knex: Knex, table: string, id: string, remap: TokenRemap, done: Set<string>) {
  if (done.has(id) || !(await knex.schema.hasTable(table))) return
  done.add(id)
  const row = await knex(table).where({ id }).first()
  if (!row) return
  await knex(table).where({ id }).update({
    document: JSON.stringify(remapDocumentTokenIds(parseJson(row.document), remap)),
  })
}

async function restoreEmbeddedThemes(knex: Knex): Promise<void> {
  const themes = await knex('design_website_themes').select('id', 'company_id', 'fonts', 'color_palettes', 'text_styles', 'button_styles')
  for (const theme of themes) {
    const fonts = classifyTokenColumn(theme.fonts)
    const colors = classifyTokenColumn(theme.color_palettes)
    const texts = classifyTokenColumn(theme.text_styles)
    const buttons = classifyTokenColumn(theme.button_styles)
    if ([fonts, colors, texts, buttons].some((column) => column.kind === 'embedded')) continue
    const companyId = String(theme.company_id)
    if (fonts.kind !== 'ids' || colors.kind !== 'ids' || texts.kind !== 'ids' || buttons.kind !== 'ids') continue
    const hydrated = hydrateCompanyTokenRows({
      fontIds: fonts.ids,
      paletteIds: colors.ids,
      textStyleIds: texts.ids,
      buttonStyleIds: buttons.ids,
      fonts: await rowsFor(knex, COMPANY_TOKEN_TABLE.font, companyId, fonts.ids),
      colors: await rowsFor(knex, COMPANY_TOKEN_TABLE.color, companyId, colors.ids),
      texts: await rowsFor(knex, COMPANY_TOKEN_TABLE.text, companyId, texts.ids),
      buttons: await rowsFor(knex, COMPANY_TOKEN_TABLE.button, companyId, buttons.ids),
    })
    await knex('design_website_themes').where({ id: theme.id }).update({
      fonts: JSON.stringify(hydrated.fonts),
      color_palettes: JSON.stringify(hydrated.colorPalettes),
      text_styles: JSON.stringify(hydrated.textStyles),
      button_styles: JSON.stringify(hydrated.buttonStyles),
    })
  }
}

async function rowsFor(knex: Knex, table: string, companyId: string, ids: string[]) {
  if (ids.length === 0) return []
  return knex(table).where({ company_id: companyId }).whereIn('id', ids)
}

async function idSet(knex: Knex, table: string): Promise<Set<string>> {
  if (!(await knex.schema.hasTable(table))) return new Set()
  const rows = await knex(table).select('id')
  return new Set(rows.map((row: { id: string }) => String(row.id)))
}

function emptySets() {
  return {
    font: new Set<string>(),
    color: new Set<string>(),
    text: new Set<string>(),
    button: new Set<string>(),
  }
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}
