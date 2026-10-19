import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  copyPresetDocument,
  linkHomeMenu,
  replaceCompanyName,
} from '../catalog/websiteLibrary.js'
import { db } from '../models/db.js'
import { HttpError } from './httpError.js'
import { applyNamesFilter, namedListWindow } from '../utils/namesQuery.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import {
  websiteDocumentSchema,
  type WebsiteDocumentV1,
} from '../schemas/websiteDocument.schema.js'
import {
  buttonLibraryDefinitionSchema,
  textLibraryDefinitionSchema,
  websiteButtonStyleSchema,
  websiteColorLibraryPaletteSchema,
  websiteColorTokenSchema,
  websiteFontTokenSchema,
  websiteTextStyleSchema,
} from '../schemas/websiteThemes.schema.js'
import {
  normalizeColorLibraryPalette,
  parseStoredColorLibraryPalette,
  type WebsiteColorLibraryPalette,
} from '../utils/colorLibraryPalette.js'
import { normalizeStoredCustomization } from '../utils/websiteElementRoot.js'

const starterThemeSchema = z.object({
  name: z.string().min(1),
  pageBackground: z.string().min(1),
  bodyTextColor: z.string().min(1),
  fonts: z.array(websiteFontTokenSchema),
  colors: z.array(websiteColorTokenSchema),
  textStyles: z.array(websiteTextStyleSchema),
  buttonStyles: z.array(websiteButtonStyleSchema),
})

const starterPresetSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  document: websiteDocumentSchema,
})

export type FontLibraryItem = {
  id: string
  name: string
  googleFontUrl: string
  family: string
  sortOrder: number
}

type FontLibraryRow = {
  id: string
  name: string
  google_font_url: string
  family: string
  sort_order: number
  is_active: boolean | number
}

function toFontLibraryItem(row: FontLibraryRow): FontLibraryItem {
  return {
    id: row.id,
    name: row.name,
    googleFontUrl: row.google_font_url,
    family: row.family,
    sortOrder: row.sort_order,
  }
}

function parseJson(raw: unknown): unknown {
  if (typeof raw === 'string') return JSON.parse(raw) as unknown
  return raw
}

export async function listFontLibrary(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}): Promise<{ items: FontLibraryItem[]; total: number; page: number; pageSize: number }> {
  const { names, page, pageSize, offset } = namedListWindow(input, 48)
  let query = db<FontLibraryRow>('design_website_font_library').where('is_active', true)
  applyNamesFilter(query, 'name', names)
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q]).orWhereRaw('LOWER(family) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('sort_order', 'asc').limit(pageSize).offset(offset)
  return {
    items: rows.map(toFontLibraryItem),
    total,
    page,
    pageSize,
  }
}

export async function createFontLibraryItem(input: {
  name: string
  googleFontUrl: string
  family: string
}): Promise<FontLibraryItem> {
  const existing = await db<FontLibraryRow>('design_website_font_library')
    .where({ google_font_url: input.googleFontUrl })
    .first()
  if (existing) {
    if (!existing.is_active) {
      await db('design_website_font_library').where({ id: existing.id }).update({
        is_active: true,
        name: input.name,
        family: input.family,
      })
    }
    const row = await db<FontLibraryRow>('design_website_font_library').where({ id: existing.id }).first()
    if (!row) throw new HttpError(500, 'Could not save the font', 'FONT_LIBRARY_SAVE_FAILED')
    return toFontLibraryItem(row)
  }

  const maxRow = await db('design_website_font_library').max<{ max: number | string | null }>('sort_order as max').first()
  const sortOrder = Number(maxRow?.max ?? 0) + 1
  const id = nanoid()
  await db('design_website_font_library').insert({
    id,
    name: input.name,
    google_font_url: input.googleFontUrl,
    family: input.family,
    sort_order: sortOrder,
    is_active: true,
  })
  return {
    id,
    name: input.name,
    googleFontUrl: input.googleFontUrl,
    family: input.family,
    sortOrder,
  }
}

export async function updateFontLibraryItem(
  id: string,
  input: {
    name: string
    googleFontUrl: string
    family: string
  },
): Promise<FontLibraryItem> {
  const row = await db<FontLibraryRow>('design_website_font_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Font not found', 'FONT_LIBRARY_NOT_FOUND')
  }
  const urlTaken = await db<FontLibraryRow>('design_website_font_library')
    .where({ google_font_url: input.googleFontUrl })
    .whereNot({ id })
    .where('is_active', true)
    .first()
  if (urlTaken) {
    throw new HttpError(409, 'A font with this Google Font URL already exists', 'FONT_LIBRARY_URL_TAKEN')
  }
  await db('design_website_font_library').where({ id }).update({
    name: input.name,
    google_font_url: input.googleFontUrl,
    family: input.family,
  })
  const updated = await db<FontLibraryRow>('design_website_font_library').where({ id }).first()
  if (!updated) throw new HttpError(500, 'Could not save the font', 'FONT_LIBRARY_SAVE_FAILED')
  return toFontLibraryItem(updated)
}

export async function deleteFontLibraryItem(id: string): Promise<void> {
  const row = await db<FontLibraryRow>('design_website_font_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Font not found', 'FONT_LIBRARY_NOT_FOUND')
  }
  await db('design_website_font_library').where({ id }).update({ is_active: false })
}

export type ColorLibraryItem = {
  id: string
  name: string
  palette: WebsiteColorLibraryPalette
  sortOrder: number
}

type ColorLibraryRow = {
  id: string
  name: string
  palette: string | WebsiteColorLibraryPalette
  sort_order: number
  is_active: boolean | number
}

function parseColorLibraryPalette(raw: string | WebsiteColorLibraryPalette): WebsiteColorLibraryPalette {
  const parsed = parseStoredColorLibraryPalette(raw)
  return normalizeColorLibraryPalette(websiteColorLibraryPaletteSchema.parse(parsed))
}

function toColorLibraryItem(row: ColorLibraryRow): ColorLibraryItem {
  return {
    id: row.id,
    name: row.name,
    palette: parseColorLibraryPalette(row.palette),
    sortOrder: row.sort_order,
  }
}

export async function listColorLibrary(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}): Promise<{ items: ColorLibraryItem[]; total: number; page: number; pageSize: number }> {
  const { names, page, pageSize, offset } = namedListWindow(input, 48)
  let query = db<ColorLibraryRow>('design_website_color_library').where('is_active', true)
  applyNamesFilter(query, 'name', names)
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('sort_order', 'asc').limit(pageSize).offset(offset)
  return {
    items: rows.map(toColorLibraryItem),
    total,
    page,
    pageSize,
  }
}

export async function createColorLibraryItem(input: {
  name: string
  palette: WebsiteColorLibraryPalette
}): Promise<ColorLibraryItem> {
  const palette = parseColorLibraryPalette(input.palette)
  const existing = await db<ColorLibraryRow>('design_website_color_library')
    .whereRaw('LOWER(name) = ?', [input.name.trim().toLowerCase()])
    .first()
  if (existing) {
    if (!existing.is_active) {
      await db('design_website_color_library').where({ id: existing.id }).update({
        is_active: true,
        name: input.name,
        palette: JSON.stringify(palette),
      })
    }
    const row = await db<ColorLibraryRow>('design_website_color_library').where({ id: existing.id }).first()
    if (!row) throw new HttpError(500, 'Could not save the color palette', 'COLOR_LIBRARY_SAVE_FAILED')
    return toColorLibraryItem(row)
  }

  const maxRow = await db('design_website_color_library').max<{ max: number | string | null }>('sort_order as max').first()
  const sortOrder = Number(maxRow?.max ?? 0) + 1
  const id = nanoid()
  await db('design_website_color_library').insert({
    id,
    name: input.name,
    palette: JSON.stringify(palette),
    sort_order: sortOrder,
    is_active: true,
  })
  return {
    id,
    name: input.name,
    palette,
    sortOrder,
  }
}

export async function updateColorLibraryItem(
  id: string,
  input: {
    name: string
    palette: WebsiteColorLibraryPalette
  },
): Promise<ColorLibraryItem> {
  const row = await db<ColorLibraryRow>('design_website_color_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Color palette not found', 'COLOR_LIBRARY_NOT_FOUND')
  }
  const palette = parseColorLibraryPalette(input.palette)
  const nameTaken = await db<ColorLibraryRow>('design_website_color_library')
    .whereRaw('LOWER(name) = ?', [input.name.trim().toLowerCase()])
    .whereNot({ id })
    .where('is_active', true)
    .first()
  if (nameTaken) {
    throw new HttpError(409, 'A palette with this name already exists', 'COLOR_LIBRARY_NAME_TAKEN')
  }
  await db('design_website_color_library').where({ id }).update({
    name: input.name.trim(),
    palette: JSON.stringify(palette),
  })
  const updated = await db<ColorLibraryRow>('design_website_color_library').where({ id }).first()
  if (!updated) throw new HttpError(500, 'Could not save the color palette', 'COLOR_LIBRARY_SAVE_FAILED')
  return toColorLibraryItem(updated)
}

export async function deleteColorLibraryItem(id: string): Promise<void> {
  const row = await db<ColorLibraryRow>('design_website_color_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Color not found', 'COLOR_LIBRARY_NOT_FOUND')
  }
  await db('design_website_color_library').where({ id }).update({ is_active: false })
}

export type WebsiteElementCustomization = {
  html: string
  styles: string
  scripts: string
}

export type ElementLibraryPatch<TDefinition> = {
  name?: string
  definition?: Partial<TDefinition>
  html?: string
  styles?: string
  scripts?: string
}

function readCustomization(value: unknown): WebsiteElementCustomization {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { html: '', styles: '', scripts: '' }
  }
  const record = value as Record<string, unknown>
  return {
    html: typeof record.html === 'string' ? record.html : '',
    styles: typeof record.styles === 'string' ? record.styles : '',
    scripts: typeof record.scripts === 'string' ? record.scripts : '',
  }
}

function mergeCustomization(
  existing: WebsiteElementCustomization,
  patch: ElementLibraryPatch<{ customization?: WebsiteElementCustomization }>,
  kind: 'button' | 'text',
  scopeId: string,
): WebsiteElementCustomization | undefined {
  const fromDef = patch.definition?.customization
  const touched =
    patch.html !== undefined ||
    patch.styles !== undefined ||
    patch.scripts !== undefined ||
    fromDef !== undefined
  const next = touched
    ? {
        html: patch.html ?? fromDef?.html ?? existing.html,
        styles: patch.styles ?? fromDef?.styles ?? existing.styles,
        scripts: patch.scripts ?? fromDef?.scripts ?? existing.scripts,
      }
    : existing
  return normalizeStoredCustomization(next, kind, scopeId)
}

export type TextLibraryDefinition = {
  fontName: string
  googleFontUrl: string
  family: string
  colorName: string
  colorValue: string
  size: number
  sizeByBreakpoint?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  customization?: WebsiteElementCustomization
}

export type TextLibraryItem = {
  id: string
  name: string
  definition: TextLibraryDefinition
  sortOrder: number
}

type TextLibraryRow = {
  id: string
  name: string
  definition: string | TextLibraryDefinition
  sort_order: number
  is_active: boolean | number
}

function parseTextLibraryDefinition(raw: string | TextLibraryDefinition): TextLibraryDefinition {
  if (typeof raw === 'object' && raw !== null) return raw
  return JSON.parse(String(raw)) as TextLibraryDefinition
}

function toTextLibraryItem(row: TextLibraryRow): TextLibraryItem {
  const definition = parseTextLibraryDefinition(row.definition)
  const customization = normalizeStoredCustomization(definition.customization, 'text', row.id)
  return {
    id: row.id,
    name: row.name,
    definition: customization ? { ...definition, customization } : { ...definition, customization: undefined },
    sortOrder: row.sort_order,
  }
}

export async function listTextLibrary(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}): Promise<{ items: TextLibraryItem[]; total: number; page: number; pageSize: number }> {
  const { names, page, pageSize, offset } = namedListWindow(input, 48)
  let query = db<TextLibraryRow>('design_website_text_library').where('is_active', true)
  applyNamesFilter(query, 'name', names)
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('sort_order', 'asc').limit(pageSize).offset(offset)
  return {
    items: rows.map(toTextLibraryItem),
    total,
    page,
    pageSize,
  }
}

export async function getTextLibraryItem(id: string): Promise<TextLibraryItem> {
  const row = await db<TextLibraryRow>('design_website_text_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Text style not found', 'TEXT_LIBRARY_NOT_FOUND')
  }
  return toTextLibraryItem(row)
}

export async function createTextLibraryItem(input: {
  name: string
  definition: TextLibraryDefinition
}): Promise<TextLibraryItem> {
  const existing = await db<TextLibraryRow>('design_website_text_library')
    .whereRaw('LOWER(name) = ?', [input.name.trim().toLowerCase()])
    .first()
  if (existing) {
    if (!existing.is_active) {
      await db('design_website_text_library').where({ id: existing.id }).update({
        is_active: true,
        name: input.name,
        definition: JSON.stringify(input.definition),
      })
    }
    const row = await db<TextLibraryRow>('design_website_text_library').where({ id: existing.id }).first()
    if (!row) throw new HttpError(500, 'Could not save the text style', 'TEXT_LIBRARY_SAVE_FAILED')
    return toTextLibraryItem(row)
  }

  const maxRow = await db('design_website_text_library').max<{ max: number | string | null }>('sort_order as max').first()
  const sortOrder = Number(maxRow?.max ?? 0) + 1
  const id = nanoid()
  await db('design_website_text_library').insert({
    id,
    name: input.name,
    definition: JSON.stringify(input.definition),
    sort_order: sortOrder,
    is_active: true,
  })
  return {
    id,
    name: input.name,
    definition: input.definition,
    sortOrder,
  }
}

export async function updateTextLibraryItem(
  id: string,
  input: {
    name: string
    definition: TextLibraryDefinition
  },
): Promise<TextLibraryItem> {
  const row = await db<TextLibraryRow>('design_website_text_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Text style not found', 'TEXT_LIBRARY_NOT_FOUND')
  }
  const nameTaken = await db<TextLibraryRow>('design_website_text_library')
    .whereRaw('LOWER(name) = ?', [input.name.trim().toLowerCase()])
    .whereNot({ id })
    .where('is_active', true)
    .first()
  if (nameTaken) {
    throw new HttpError(409, 'A text style with this name already exists', 'TEXT_LIBRARY_NAME_TAKEN')
  }
  await db('design_website_text_library').where({ id }).update({
    name: input.name.trim(),
    definition: JSON.stringify(input.definition),
  })
  const updated = await db<TextLibraryRow>('design_website_text_library').where({ id }).first()
  if (!updated) throw new HttpError(500, 'Could not save the text style', 'TEXT_LIBRARY_SAVE_FAILED')
  return toTextLibraryItem(updated)
}

export async function patchTextLibraryItem(
  id: string,
  patch: ElementLibraryPatch<TextLibraryDefinition>,
): Promise<TextLibraryItem> {
  const existing = await getTextLibraryItem(id)
  const name = patch.name?.trim() || existing.name
  const definitionFields = { ...(patch.definition ?? {}) }
  delete definitionFields.customization
  const mergedDefinition: TextLibraryDefinition = {
    ...existing.definition,
    ...definitionFields,
  }
  const customization = mergeCustomization(
    readCustomization(existing.definition.customization),
    patch,
    'text',
    id,
  )
  if (customization) {
    mergedDefinition.customization = customization
  } else {
    delete mergedDefinition.customization
  }
  const parsed = textLibraryDefinitionSchema.parse(mergedDefinition)
  return updateTextLibraryItem(id, { name, definition: parsed })
}

export async function deleteTextLibraryItem(id: string): Promise<void> {
  const row = await db<TextLibraryRow>('design_website_text_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Text style not found', 'TEXT_LIBRARY_NOT_FOUND')
  }
  await db('design_website_text_library').where({ id }).update({ is_active: false })
}

export type ButtonLibraryDefinition = {
  backgroundColorName: string
  backgroundColorValue: string
  textColorName: string
  textColorValue: string
  borderColorName: string
  borderColorValue: string
  borderWidth: number
  radius: number
  textStyleName: string
  textFontName: string
  textGoogleFontUrl: string
  textFontFamily: string
  textSize: number
  labelColorName: string
  labelColorValue: string
  customization?: WebsiteElementCustomization
}

export type ButtonLibraryItem = {
  id: string
  name: string
  definition: ButtonLibraryDefinition
  sortOrder: number
}

type ButtonLibraryRow = {
  id: string
  name: string
  definition: string | ButtonLibraryDefinition
  sort_order: number
  is_active: boolean | number
}

function parseButtonLibraryDefinition(raw: string | ButtonLibraryDefinition): ButtonLibraryDefinition {
  if (typeof raw === 'object' && raw !== null) return raw
  return JSON.parse(String(raw)) as ButtonLibraryDefinition
}

function toButtonLibraryItem(row: ButtonLibraryRow): ButtonLibraryItem {
  const definition = parseButtonLibraryDefinition(row.definition)
  const customization = normalizeStoredCustomization(definition.customization, 'button', row.id)
  return {
    id: row.id,
    name: row.name,
    definition: customization ? { ...definition, customization } : { ...definition, customization: undefined },
    sortOrder: row.sort_order,
  }
}

export async function listButtonLibrary(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}): Promise<{ items: ButtonLibraryItem[]; total: number; page: number; pageSize: number }> {
  const { names, page, pageSize, offset } = namedListWindow(input, 48)
  let query = db<ButtonLibraryRow>('design_website_button_library').where('is_active', true)
  applyNamesFilter(query, 'name', names)
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('sort_order', 'asc').limit(pageSize).offset(offset)
  return {
    items: rows.map(toButtonLibraryItem),
    total,
    page,
    pageSize,
  }
}

export async function getButtonLibraryItem(id: string): Promise<ButtonLibraryItem> {
  const row = await db<ButtonLibraryRow>('design_website_button_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Button style not found', 'BUTTON_LIBRARY_NOT_FOUND')
  }
  return toButtonLibraryItem(row)
}

export async function createButtonLibraryItem(input: {
  name: string
  definition: ButtonLibraryDefinition
}): Promise<ButtonLibraryItem> {
  const existing = await db<ButtonLibraryRow>('design_website_button_library')
    .whereRaw('LOWER(name) = ?', [input.name.trim().toLowerCase()])
    .first()
  if (existing) {
    if (!existing.is_active) {
      await db('design_website_button_library').where({ id: existing.id }).update({
        is_active: true,
        name: input.name,
        definition: JSON.stringify(input.definition),
      })
    }
    const row = await db<ButtonLibraryRow>('design_website_button_library').where({ id: existing.id }).first()
    if (!row) throw new HttpError(500, 'Could not save the button style', 'BUTTON_LIBRARY_SAVE_FAILED')
    return toButtonLibraryItem(row)
  }

  const maxRow = await db('design_website_button_library').max<{ max: number | string | null }>('sort_order as max').first()
  const sortOrder = Number(maxRow?.max ?? 0) + 1
  const id = nanoid()
  await db('design_website_button_library').insert({
    id,
    name: input.name,
    definition: JSON.stringify(input.definition),
    sort_order: sortOrder,
    is_active: true,
  })
  return {
    id,
    name: input.name,
    definition: input.definition,
    sortOrder,
  }
}

export async function updateButtonLibraryItem(
  id: string,
  input: {
    name: string
    definition: ButtonLibraryDefinition
  },
): Promise<ButtonLibraryItem> {
  const row = await db<ButtonLibraryRow>('design_website_button_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Button style not found', 'BUTTON_LIBRARY_NOT_FOUND')
  }
  const nameTaken = await db<ButtonLibraryRow>('design_website_button_library')
    .whereRaw('LOWER(name) = ?', [input.name.trim().toLowerCase()])
    .whereNot({ id })
    .where('is_active', true)
    .first()
  if (nameTaken) {
    throw new HttpError(409, 'A button style with this name already exists', 'BUTTON_LIBRARY_NAME_TAKEN')
  }
  await db('design_website_button_library').where({ id }).update({
    name: input.name.trim(),
    definition: JSON.stringify(input.definition),
  })
  const updated = await db<ButtonLibraryRow>('design_website_button_library').where({ id }).first()
  if (!updated) throw new HttpError(500, 'Could not save the button style', 'BUTTON_LIBRARY_SAVE_FAILED')
  return toButtonLibraryItem(updated)
}

export async function patchButtonLibraryItem(
  id: string,
  patch: ElementLibraryPatch<ButtonLibraryDefinition>,
): Promise<ButtonLibraryItem> {
  const existing = await getButtonLibraryItem(id)
  const name = patch.name?.trim() || existing.name
  const definitionFields = { ...(patch.definition ?? {}) }
  delete definitionFields.customization
  const mergedDefinition: ButtonLibraryDefinition = {
    ...existing.definition,
    ...definitionFields,
  }
  if (definitionFields.textColorValue) {
    mergedDefinition.labelColorValue = mergedDefinition.textColorValue
    if (definitionFields.textColorName) {
      mergedDefinition.labelColorName = mergedDefinition.textColorName
    }
  }
  const customization = mergeCustomization(
    readCustomization(existing.definition.customization),
    patch,
    'button',
    id,
  )
  if (customization) {
    mergedDefinition.customization = customization
  } else {
    delete mergedDefinition.customization
  }
  const parsed = buttonLibraryDefinitionSchema.parse(mergedDefinition)
  return updateButtonLibraryItem(id, { name, definition: parsed })
}

export async function deleteButtonLibraryItem(id: string): Promise<void> {
  const row = await db<ButtonLibraryRow>('design_website_button_library').where({ id }).first()
  if (!row || !row.is_active) {
    throw new HttpError(404, 'Button style not found', 'BUTTON_LIBRARY_NOT_FOUND')
  }
  await db('design_website_button_library').where({ id }).update({ is_active: false })
}

type StoredStarter = {
  theme: z.infer<typeof starterThemeSchema>
  presets: Array<z.infer<typeof starterPresetSchema>>
}

async function loadActiveStarter(): Promise<StoredStarter> {
  const row = await db('design_website_starter_templates')
    .where({ slug: 'default', is_active: true })
    .first()
  if (!row) {
    throw new HttpError(503, 'Starter website template is not configured', 'STARTER_TEMPLATE_MISSING')
  }
  const theme = starterThemeSchema.safeParse(parseJson(row.theme))
  const presets = z.array(starterPresetSchema).safeParse(parseJson(row.presets))
  if (!theme.success || !presets.success) {
    throw new HttpError(503, 'Starter website template is invalid', 'STARTER_TEMPLATE_INVALID')
  }
  return { theme: theme.data, presets: presets.data }
}

function presetDocument(starter: StoredStarter, slug: string): WebsiteDocumentV1 {
  const preset = starter.presets.find((item) => item.slug === slug)
  if (!preset) {
    throw new HttpError(503, `Starter preset ${slug} is missing`, 'STARTER_TEMPLATE_INVALID')
  }
  return preset.document
}

export async function ensureStarterWebsite(input: {
  companyId: string
  companyName: string
  userId: string | null
}): Promise<{ created: boolean; pageId: string }> {
  const existing = await db('design_website_pages')
    .where({ company_id: input.companyId })
    .orderBy('created_at', 'asc')
    .first<{ id: string }>('id')
  if (existing) return { created: false, pageId: existing.id }

  const starter = await loadActiveStarter()
  const companyName = input.companyName.trim() || 'Company'

  const themeId = nanoid()
  const headerId = nanoid()
  const footerId = nanoid()
  const layoutId = nanoid()
  const pageId = nanoid()
  const now = () => db.fn.now(3)

  const header = linkHomeMenu(
    copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-header'), companyName)),
    pageId,
  )
  const footer = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-footer'), companyName))
  const home = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'welcome'), companyName))

  const presetRows = starter.presets.map((preset) => ({
    id: nanoid(),
    company_id: input.companyId,
    name: preset.name,
    document: JSON.stringify(copyPresetDocument(replaceCompanyName(preset.document, companyName))),
    is_locked: true,
    created_by: input.userId,
    created_at: now(),
    updated_at: now(),
  }))

  try {
    await db.transaction(async (trx) => {
      const raced = await trx('design_website_pages')
        .where({ company_id: input.companyId })
        .first('id')
      if (raced) return

      await trx('design_website_presets').insert(presetRows)
      await trx('design_website_themes').insert({
        id: themeId,
        company_id: input.companyId,
        name: starter.theme.name,
        page_background: starter.theme.pageBackground,
        body_text_color: starter.theme.bodyTextColor,
        is_active: true,
        is_default: true,
        is_locked: true,
        fonts: JSON.stringify(starter.theme.fonts),
        colors: JSON.stringify(starter.theme.colors),
        text_styles: JSON.stringify(starter.theme.textStyles),
        button_styles: JSON.stringify(starter.theme.buttonStyles),
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_headers').insert({
        id: headerId,
        company_id: input.companyId,
        name: 'Header',
        is_default: true,
        is_locked: true,
        document: JSON.stringify(header),
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_footers').insert({
        id: footerId,
        company_id: input.companyId,
        name: 'Footer',
        is_default: true,
        is_locked: true,
        document: JSON.stringify(footer),
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_layouts').insert({
        id: layoutId,
        company_id: input.companyId,
        name: 'Default',
        header_id: headerId,
        footer_id: footerId,
        theme_id: themeId,
        is_default: true,
        is_locked: true,
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_pages').insert({
        id: pageId,
        company_id: input.companyId,
        name: 'Home',
        path: '',
        status: 'active',
        layout_id: layoutId,
        sort_order: 0,
        document: JSON.stringify(home),
        is_locked: true,
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_datasets').insert({
        id: nanoid(),
        company_id: input.companyId,
        name: 'Products',
        source_type: 'products',
        filters: JSON.stringify({ match: 'all', rules: [] }),
        config: JSON.stringify({}),
        selected_fields: JSON.stringify(['name']),
        status: 'active',
        is_locked: true,
        created_by: input.userId,
        created_at: now(),
        updated_at: now(),
      })
      await trx('design_website_site_settings').insert({
        company_id: input.companyId,
        home_page_id: pageId,
        created_at: now(),
        updated_at: now(),
      })
    })
  } catch (err) {
    const again = await db('design_website_pages')
      .where({ company_id: input.companyId })
      .orderBy('created_at', 'asc')
      .first<{ id: string }>('id')
    if (again) return { created: false, pageId: again.id }
    throw err
  }

  const saved = await db('design_website_pages')
    .where({ company_id: input.companyId, id: pageId })
    .first('id')
  if (!saved) {
    const winner = await db('design_website_pages')
      .where({ company_id: input.companyId })
      .orderBy('created_at', 'asc')
      .first<{ id: string }>('id')
    if (winner) return { created: false, pageId: winner.id }
    throw new HttpError(500, 'Failed to create the starter website', 'STARTER_WEBSITE_FAILED')
  }
  return { created: true, pageId }
}

async function hasLockedNamed(table: string, companyId: string, name: string): Promise<boolean> {
  const row = await db(table)
    .where({ company_id: companyId })
    .where('is_locked', true)
    .whereRaw('BINARY name = ?', [name])
    .first('id')
  return Boolean(row)
}

async function lockedId(table: string, companyId: string, name?: string): Promise<string | null> {
  let query = db(table).where({ company_id: companyId }).where('is_locked', true)
  if (name) query = query.whereRaw('BINARY name = ?', [name])
  const row = await query.first<{ id: string }>('id')
  return row?.id ?? null
}

async function lockNamedRow(table: string, companyId: string, name: string): Promise<void> {
  if (await hasLockedNamed(table, companyId, name)) return
  const row = await db(table)
    .where({ company_id: companyId })
    .whereRaw('BINARY name = ?', [name])
    .first<{ id: string }>('id')
  if (!row) return
  await db(table).where({ id: row.id }).update({ is_locked: true, updated_at: db.fn.now(3) })
}

const STARTER_NAMES: Array<[string, string[]]> = [
  ['design_website_themes', ['Default']],
  ['design_website_headers', ['Header']],
  ['design_website_footers', ['Footer']],
  ['design_website_layouts', ['Default']],
  ['design_website_datasets', ['Products']],
  ['design_website_presets', ['Site header', 'Site footer', 'Welcome']],
  ['design_website_pages', ['Home']],
]

async function releaseMismatchedLocks(companyId: string): Promise<void> {
  for (const [table, names] of STARTER_NAMES) {
    const placeholders = names.map(() => '?').join(', ')
    await db(table)
      .where({ company_id: companyId })
      .where('is_locked', true)
      .whereRaw(`BINARY name NOT IN (${placeholders})`, names)
      .update({ is_locked: false, updated_at: db.fn.now(3) })
  }
}

async function defaultsComplete(companyId: string): Promise<boolean> {
  for (const [table, names] of STARTER_NAMES) {
    for (const name of names) {
      if (!(await hasLockedNamed(table, companyId, name))) return false
    }
  }
  return true
}

async function freePagePath(companyId: string): Promise<string> {
  for (const path of ['', 'home', 'home-default']) {
    const taken = await db('design_website_pages').where({ company_id: companyId, path }).first('id')
    if (!taken) return path
  }
  const suffix = nanoid(6).toLowerCase().replace(/[^a-z0-9]/g, 'a')
  return `home-${suffix}`
}

async function backfillLockedDefaults(input: {
  companyId: string
  companyName: string
  userId: string | null
}): Promise<void> {
  await lockNamedRow('design_website_themes', input.companyId, 'Default')
  await lockNamedRow('design_website_headers', input.companyId, 'Header')
  await lockNamedRow('design_website_footers', input.companyId, 'Footer')
  await lockNamedRow('design_website_layouts', input.companyId, 'Default')
  await lockNamedRow('design_website_datasets', input.companyId, 'Products')

  const home = await db('design_website_pages')
    .where({ company_id: input.companyId, path: '' })
    .whereRaw('BINARY name = ?', ['Home'])
    .first<{ id: string; is_locked: number | boolean }>('id', 'is_locked')
  if (home && home.is_locked !== true && home.is_locked !== 1 && !(await hasLockedNamed('design_website_pages', input.companyId, 'Home'))) {
    await db('design_website_pages').where({ id: home.id }).update({ is_locked: true, updated_at: db.fn.now(3) })
  }

  for (const name of ['Site header', 'Site footer', 'Welcome']) {
    await lockNamedRow('design_website_presets', input.companyId, name)
  }

  const starter = await loadActiveStarter()
  const now = () => db.fn.now(3)
  const companyName = input.companyName

  if (!(await hasLockedNamed('design_website_themes', input.companyId, 'Default'))) {
    await db('design_website_themes').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: starter.theme.name,
      page_background: starter.theme.pageBackground,
      body_text_color: starter.theme.bodyTextColor,
      is_active: true,
      is_default: false,
      is_locked: true,
      fonts: JSON.stringify(starter.theme.fonts),
      colors: JSON.stringify(starter.theme.colors),
      text_styles: JSON.stringify(starter.theme.textStyles),
      button_styles: JSON.stringify(starter.theme.buttonStyles),
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }

  const pageId = (await lockedId('design_website_pages', input.companyId, 'Home')) ?? nanoid()
  const headerDocument = linkHomeMenu(
    copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-header'), companyName)),
    pageId,
  )
  const footerDocument = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'site-footer'), companyName))
  const homeDocument = copyPresetDocument(replaceCompanyName(presetDocument(starter, 'welcome'), companyName))

  if (!(await hasLockedNamed('design_website_headers', input.companyId, 'Header'))) {
    await db('design_website_headers').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Header',
      is_default: false,
      is_locked: true,
      document: JSON.stringify(headerDocument),
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_footers', input.companyId, 'Footer'))) {
    await db('design_website_footers').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Footer',
      is_default: false,
      is_locked: true,
      document: JSON.stringify(footerDocument),
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_layouts', input.companyId, 'Default'))) {
    await db('design_website_layouts').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Default',
      header_id: await lockedId('design_website_headers', input.companyId, 'Header'),
      footer_id: await lockedId('design_website_footers', input.companyId, 'Footer'),
      theme_id: await lockedId('design_website_themes', input.companyId, 'Default'),
      is_default: false,
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_pages', input.companyId, 'Home'))) {
    await db('design_website_pages').insert({
      id: pageId,
      company_id: input.companyId,
      name: 'Home',
      path: await freePagePath(input.companyId),
      status: 'active',
      layout_id: await lockedId('design_website_layouts', input.companyId, 'Default'),
      sort_order: 0,
      document: JSON.stringify(homeDocument),
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  for (const preset of starter.presets) {
    const locked = await hasLockedNamed('design_website_presets', input.companyId, preset.name)
    if (locked) continue
    await db('design_website_presets').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: preset.name,
      document: JSON.stringify(copyPresetDocument(replaceCompanyName(preset.document, companyName))),
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
  if (!(await hasLockedNamed('design_website_datasets', input.companyId, 'Products'))) {
    await db('design_website_datasets').insert({
      id: nanoid(),
      company_id: input.companyId,
      name: 'Products',
      source_type: 'products',
      filters: JSON.stringify({ match: 'all', rules: [] }),
      config: JSON.stringify({}),
      selected_fields: JSON.stringify(['name']),
      status: 'active',
      is_locked: true,
      created_by: input.userId,
      created_at: now(),
      updated_at: now(),
    })
  }
}

export async function ensureCompanyWebsiteDefaults(input: {
  companyId: string
  userId: string | null
  companyName?: string
}): Promise<void> {
  if (await defaultsComplete(input.companyId)) return
  await releaseMismatchedLocks(input.companyId)
  const companyName =
    input.companyName?.trim() ||
    (await getCompanyFromWebOnOne(input.companyId)).name.trim() ||
    'Company'
  const anyPage = await db('design_website_pages').where({ company_id: input.companyId }).first('id')
  if (!anyPage) {
    await ensureStarterWebsite({
      companyId: input.companyId,
      companyName,
      userId: input.userId,
    })
  }
  if (await defaultsComplete(input.companyId)) return
  await backfillLockedDefaults({
    companyId: input.companyId,
    companyName,
    userId: input.userId,
  })
}
