import { nanoid } from 'nanoid'
import { db, type DesignWebsiteThemeRow } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { countLayoutsUsingTheme } from './websiteLayout.service.js'
import { applyNamesFilter, namedListWindow } from '../utils/namesQuery.js'
import type {
  CreateWebsiteThemeBody,
  UpdateWebsiteThemeBody,
  WebsiteButtonStyle,
  WebsiteFontToken,
  WebsiteTextStyle,
  WebsiteThemeColorPalette,
} from '../schemas/websiteThemes.schema.js'
import { patchThemeColorFields, readThemeColorFields, writeThemeColorFields } from '../utils/themeColorStorage.js'
import { companyItemSource, classifyTokenColumn } from '../utils/companyThemeTokens.js'
import { deleteUnsharedThemeTokens, readCompanyThemeTokens, storeCompanyThemeTokens } from './websiteCompanyTokens.js'

export type WebsiteThemeDto = {
  id: string
  companyId: string
  name: string
  pageBackground: string
  bodyTextColor: string
  isActive: boolean
  isDefault: boolean
  sourceLibraryId: string | null
  fonts: WebsiteFontToken[]
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
  surfaceColor: string
  accentColor1: string
  accentColor2: string
  colorPalettes: ReturnType<typeof readThemeColorFields>['colorPalettes']
  textStyles: WebsiteTextStyle[]
  buttonStyles: WebsiteButtonStyle[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function parseJsonArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }
  return []
}

function toBool(value: number | boolean): boolean {
  return value === true || value === 1
}

function toDto(
  row: DesignWebsiteThemeRow,
  tokens: {
    fonts: WebsiteFontToken[]
    colorPalettes: ReturnType<typeof readThemeColorFields>['colorPalettes']
    textStyles: WebsiteTextStyle[]
    buttonStyles: WebsiteButtonStyle[]
  },
): WebsiteThemeDto {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    isActive: toBool(row.is_active),
    isDefault: toBool(row.is_default),
    sourceLibraryId: row.source_library_id ?? null,
    fonts: tokens.fonts,
    ...readThemeColorFields({ ...row, color_palettes: tokens.colorPalettes }),
    textStyles: tokens.textStyles,
    buttonStyles: tokens.buttonStyles,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

async function dtoFor(row: DesignWebsiteThemeRow): Promise<WebsiteThemeDto> {
  const tokens = await readCompanyThemeTokens(db, row.company_id, [row])
  return toDto(row, tokens.get(row.id) ?? { fonts: [], colorPalettes: [], textStyles: [], buttonStyles: [] })
}

export async function listWebsiteThemes(input: {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}): Promise<{ items: WebsiteThemeDto[]; total: number; page: number; pageSize: number }> {
  const { names, page, pageSize, offset } = namedListWindow(input, 20)
  let query = db<DesignWebsiteThemeRow>('design_website_themes').where({
    company_id: input.companyId,
  })
  applyNamesFilter(query, 'name', names)
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('is_default', 'desc').orderBy('updated_at', 'desc').limit(pageSize).offset(offset)
  const tokens = await readCompanyThemeTokens(db, input.companyId, rows)
  return {
    items: rows.map((row) =>
      toDto(row, tokens.get(row.id) ?? { fonts: [], colorPalettes: [], textStyles: [], buttonStyles: [] }),
    ),
    total,
    page,
    pageSize,
  }
}

export async function getWebsiteTheme(input: { companyId: string; id: string }): Promise<WebsiteThemeDto> {
  const row = await db<DesignWebsiteThemeRow>('design_website_themes')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!row) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  return dtoFor(row)
}

export async function getDefaultWebsiteTheme(input: { companyId: string }): Promise<WebsiteThemeDto | null> {
  const row =
    (await db<DesignWebsiteThemeRow>('design_website_themes')
      .where({ company_id: input.companyId, is_default: true, is_active: true })
      .first()) ??
    (await db<DesignWebsiteThemeRow>('design_website_themes')
      .where({ company_id: input.companyId, is_active: true })
      .orderBy('updated_at', 'desc')
      .first())
  return row ? dtoFor(row) : null
}

async function clearDefaults(companyId: string): Promise<void> {
  await db('design_website_themes').where({ company_id: companyId }).update({ is_default: false })
}

export async function createWebsiteTheme(input: {
  companyId: string
  userId: string
  body: CreateWebsiteThemeBody
}): Promise<WebsiteThemeDto> {
  await getCompanyFromWebOnOne(input.companyId)
  if (input.body.isDefault) await clearDefaults(input.companyId)
  const id = nanoid()
  const colorFields = writeThemeColorFields(input.body)
  await db.transaction(async (trx) => {
    const tokens = await storeCompanyThemeTokens(trx, {
      companyId: input.companyId,
      userId: input.userId,
      align: 'id',
      fonts: input.body.fonts,
      colorPalettes: parseJsonArray<WebsiteThemeColorPalette>(colorFields.color_palettes),
      textStyles: input.body.textStyles,
      buttonStyles: input.body.buttonStyles,
      colorPaletteId: colorFields.color_palette_id,
    })
    await trx('design_website_themes').insert({
      id,
      company_id: input.companyId,
      name: input.body.name,
      color_palette_id: tokens.colorPaletteId,
      page_background_palette_index: colorFields.page_background_palette_index,
      surface_palette_index: colorFields.surface_palette_index,
      body_text_palette_index: colorFields.body_text_palette_index,
      accent_1_palette_index: colorFields.accent_1_palette_index,
      accent_2_palette_index: colorFields.accent_2_palette_index,
      page_background_index: colorFields.page_background_index,
      surface_index: colorFields.surface_index,
      body_text_index: colorFields.body_text_index,
      accent_1_index: colorFields.accent_1_index,
      accent_2_index: colorFields.accent_2_index,
      is_active: input.body.isActive,
      is_default: input.body.isDefault,
      fonts: JSON.stringify(tokens.fontIds),
      color_palettes: JSON.stringify(tokens.paletteIds),
      text_styles: JSON.stringify(tokens.textStyleIds),
      button_styles: JSON.stringify(tokens.buttonStyleIds),
      source_library_id: companyItemSource(null),
      created_by: input.userId,
      created_at: trx.fn.now(3),
      updated_at: trx.fn.now(3),
    })
  })
  return getWebsiteTheme({ companyId: input.companyId, id })
}

export async function updateWebsiteTheme(input: {
  companyId: string
  id: string
  body: UpdateWebsiteThemeBody
}): Promise<WebsiteThemeDto> {
  const existing = await db<DesignWebsiteThemeRow>('design_website_themes')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  if (input.body.isDefault) await clearDefaults(input.companyId)
  const currentTokens = await readCompanyThemeTokens(db, input.companyId, [existing])
  const current = currentTokens.get(existing.id) ?? { fonts: [], colorPalettes: [], textStyles: [], buttonStyles: [] }
  const colorUpdates = patchThemeColorFields({ ...existing, color_palettes: current.colorPalettes }, input.body)
  const fonts = input.body.fonts ?? current.fonts
  const textStyles = input.body.textStyles ?? current.textStyles
  const buttonStyles = input.body.buttonStyles ?? current.buttonStyles
  const palettes =
    colorUpdates.color_palettes != null
      ? parseJsonArray<WebsiteThemeColorPalette>(colorUpdates.color_palettes)
      : current.colorPalettes
  const tokensChanged = colorUpdates.color_palettes != null || input.body.fonts != null || input.body.textStyles != null || input.body.buttonStyles != null
  await db.transaction(async (trx) => {
    const updates: Record<string, unknown> = { updated_at: trx.fn.now(3) }
    if (input.body.name != null) updates.name = input.body.name
    if (input.body.isActive != null) updates.is_active = input.body.isActive
    if (input.body.isDefault != null) updates.is_default = input.body.isDefault
    if (colorUpdates.page_background_palette_index !== undefined) {
      updates.page_background_palette_index = colorUpdates.page_background_palette_index
    }
    if (colorUpdates.surface_palette_index !== undefined) updates.surface_palette_index = colorUpdates.surface_palette_index
    if (colorUpdates.body_text_palette_index !== undefined) {
      updates.body_text_palette_index = colorUpdates.body_text_palette_index
    }
    if (colorUpdates.accent_1_palette_index !== undefined) updates.accent_1_palette_index = colorUpdates.accent_1_palette_index
    if (colorUpdates.accent_2_palette_index !== undefined) updates.accent_2_palette_index = colorUpdates.accent_2_palette_index
    if (colorUpdates.page_background_index !== undefined) updates.page_background_index = colorUpdates.page_background_index
    if (colorUpdates.surface_index !== undefined) updates.surface_index = colorUpdates.surface_index
    if (colorUpdates.body_text_index !== undefined) updates.body_text_index = colorUpdates.body_text_index
    if (colorUpdates.accent_1_index !== undefined) updates.accent_1_index = colorUpdates.accent_1_index
    if (colorUpdates.accent_2_index !== undefined) updates.accent_2_index = colorUpdates.accent_2_index
    if (tokensChanged) {
      const stored = await storeCompanyThemeTokens(trx, {
        companyId: input.companyId,
        userId: existing.created_by,
        align: 'id',
        fonts,
        colorPalettes: palettes,
        textStyles,
        buttonStyles,
        colorPaletteId:
          typeof colorUpdates.color_palette_id === 'string' || colorUpdates.color_palette_id === null
            ? colorUpdates.color_palette_id
            : existing.color_palette_id,
      })
      updates.fonts = JSON.stringify(stored.fontIds)
      updates.color_palettes = JSON.stringify(stored.paletteIds)
      updates.text_styles = JSON.stringify(stored.textStyleIds)
      updates.button_styles = JSON.stringify(stored.buttonStyleIds)
      updates.color_palette_id = stored.colorPaletteId
    } else if (colorUpdates.color_palette_id !== undefined) {
      updates.color_palette_id = colorUpdates.color_palette_id
    }
    await trx('design_website_themes').where({ id: input.id, company_id: input.companyId }).update(updates)
  })
  return getWebsiteTheme({ companyId: input.companyId, id: input.id })
}

export async function setDefaultWebsiteTheme(input: {
  companyId: string
  id: string
}): Promise<WebsiteThemeDto> {
  return updateWebsiteTheme({
    companyId: input.companyId,
    id: input.id,
    body: { isDefault: true, isActive: true },
  })
}

export async function deleteWebsiteTheme(input: { companyId: string; id: string }): Promise<void> {
  const existing = await db<DesignWebsiteThemeRow>('design_website_themes')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  const used = await countLayoutsUsingTheme({ companyId: input.companyId, id: input.id })
  if (used > 0) {
    throw new HttpError(409, 'This theme is used by a layout', 'WEBSITE_THEME_IN_USE')
  }
  const fonts = classifyTokenColumn(existing.fonts)
  const palettes = classifyTokenColumn(existing.color_palettes)
  const texts = classifyTokenColumn(existing.text_styles)
  const buttons = classifyTokenColumn(existing.button_styles)
  await db.transaction(async (trx) => {
    await deleteUnsharedThemeTokens(trx, {
      companyId: input.companyId,
      themeId: input.id,
      fontIds: fonts.kind === 'ids' ? fonts.ids : [],
      paletteIds: palettes.kind === 'ids' ? palettes.ids : [],
      textStyleIds: texts.kind === 'ids' ? texts.ids : [],
      buttonStyleIds: buttons.kind === 'ids' ? buttons.ids : [],
    })
    await trx('design_website_themes').where({ id: input.id, company_id: input.companyId }).del()
  })
}
