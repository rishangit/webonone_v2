import { nanoid } from 'nanoid'
import type { Knex } from 'knex'
import { db, type WebsitePageStatus } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { emptyWebsiteDocument, websiteDocumentSchema, type WebsiteDocumentV1 } from '../schemas/websiteDocument.schema.js'
import type { CreateWebsitePageBody, UpdateWebsitePageBody } from '../schemas/websitePages.schema.js'
import type { CreateWebsiteChromeBody, UpdateWebsiteChromeBody } from '../schemas/websiteChrome.schema.js'
import type { CreateWebsitePresetBody, UpdateWebsitePresetBody } from '../schemas/websitePresets.schema.js'
import type { CreateWebsiteLayoutBody, UpdateWebsiteLayoutBody } from '../schemas/websiteLayouts.schema.js'
import type {
  CreateWebsiteThemeBody,
  UpdateWebsiteThemeBody,
  WebsiteButtonStyle,
  WebsiteColorToken,
  WebsiteFontToken,
  WebsiteTextStyle,
} from '../schemas/websiteThemes.schema.js'
import { detachCompanyDocumentRefs } from './websiteLibraryDocument.js'
import { assertWebsiteUnlocked, isLockedFlag } from './websiteLock.js'
import type { WebsiteChromeKind } from './websiteChrome.service.js'
import { applyNamesFilter, namedListWindow } from '../utils/namesQuery.js'

type Sql = Knex | Knex.Transaction

const LIB = {
  pages: 'design_website_library_pages',
  headers: 'design_website_library_headers',
  footers: 'design_website_library_footers',
  layouts: 'design_website_library_layouts',
  presets: 'design_website_library_presets',
  themes: 'design_website_library_themes',
} as const

const COMPANY = {
  pages: 'design_website_pages',
  headers: 'design_website_headers',
  footers: 'design_website_footers',
  layouts: 'design_website_layouts',
  presets: 'design_website_presets',
  themes: 'design_website_themes',
} as const

type ChromeTable = typeof LIB.headers | typeof LIB.footers

function chromeTable(kind: WebsiteChromeKind): ChromeTable {
  return kind === 'headers' ? LIB.headers : LIB.footers
}

function companyChromeTable(kind: WebsiteChromeKind): typeof COMPANY.headers | typeof COMPANY.footers {
  return kind === 'headers' ? COMPANY.headers : COMPANY.footers
}

function toBool(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1
}

function parseDocument(raw: unknown): WebsiteDocumentV1 {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  const parsed = websiteDocumentSchema.safeParse(value)
  return parsed.success ? parsed.data : emptyWebsiteDocument()
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

function stamp() {
  return { created_at: db.fn.now(3), updated_at: db.fn.now(3) }
}

async function countOf(query: Knex.QueryBuilder): Promise<number> {
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  return Number(countRow?.count ?? 0)
}

function likeName<T extends object>(query: Knex.QueryBuilder<T>, column: string, q?: string): Knex.QueryBuilder<T> {
  if (!q?.trim()) return query
  return query.andWhere((builder) => {
    builder.whereRaw(`LOWER(${column}) LIKE ?`, [`%${q.trim().toLowerCase()}%`])
  })
}

async function assertLibraryRow(table: string, id: string | null | undefined, message: string, code: string) {
  if (!id) return
  const row = await db(table).where({ id }).first()
  if (!row) throw new HttpError(400, message, code)
}

async function clearLibraryDefault(table: string) {
  await db(table).update({ is_default: false })
}

export type LibraryPageDto = {
  id: string
  companyId: string
  name: string
  path: string
  status: WebsitePageStatus
  layoutId: string | null
  layoutName: string | null
  sortOrder: number
  document: WebsiteDocumentV1
  isLocked: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

type PageRow = {
  id: string
  name: string
  path: string
  status: WebsitePageStatus
  layout_id: string | null
  layout_name?: string | null
  sort_order: number
  document: unknown
  created_by: string | null
  created_at: Date
  updated_at: Date
}

function toPageDto(row: PageRow): LibraryPageDto {
  return {
    id: row.id,
    companyId: '',
    name: row.name,
    path: row.path,
    status: row.status,
    layoutId: row.layout_id,
    layoutName: row.layout_name ?? null,
    sortOrder: row.sort_order ?? 0,
    document: parseDocument(row.document),
    isLocked: false,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function pageQuery() {
  return db<PageRow>(`${LIB.pages} as p`).leftJoin(`${LIB.layouts} as l`, 'l.id', 'p.layout_id')
}

export async function listLibraryPages(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
  status?: WebsitePageStatus
}) {
  const window = namedListWindow(input, 20)
  let query = pageQuery()
  if (input.status) query = query.andWhere('p.status', input.status)
  applyNamesFilter(query, 'p.name', window.names)
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(p.name) LIKE ?', [q]).orWhereRaw('LOWER(p.path) LIKE ?', [q])
    })
  }
  const total = await countOf(query)
  const rows = await query
    .clone()
    .select('p.*', 'l.name as layout_name')
    .orderBy('p.updated_at', 'desc')
    .limit(window.pageSize)
    .offset(window.offset)
  return { items: rows.map(toPageDto), total, page: window.page, pageSize: window.pageSize }
}

export async function getLibraryPage(id: string): Promise<LibraryPageDto> {
  const row = await pageQuery().select('p.*', 'l.name as layout_name').where('p.id', id).first()
  if (!row) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
  return toPageDto(row)
}

async function resolveLibraryLayoutId(layoutId: string | null | undefined): Promise<string | null> {
  if (layoutId) {
    await assertLibraryRow(LIB.layouts, layoutId, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
    return layoutId
  }
  if (layoutId === null) return null
  const fallback = await db(LIB.layouts).where({ is_default: true }).first<{ id: string }>()
  return fallback?.id ?? null
}

export async function createLibraryPage(input: { userId: string; body: CreateWebsitePageBody }) {
  const existing = await db(LIB.pages).where({ path: input.body.path }).first()
  if (existing) throw new HttpError(409, 'A page with this path already exists', 'WEBSITE_PAGE_PATH_TAKEN')
  const layoutId = await resolveLibraryLayoutId(input.body.layoutId)
  const sortRow = layoutId
    ? await db(LIB.pages).where({ layout_id: layoutId }).max<{ max: number | null }>('sort_order as max').first()
    : null
  const id = nanoid()
  await db(LIB.pages).insert({
    id,
    name: input.body.name,
    path: input.body.path,
    status: input.body.status,
    layout_id: layoutId,
    sort_order: Number(sortRow?.max ?? -1) + 1,
    document: JSON.stringify(input.body.document),
    created_by: input.userId,
    ...stamp(),
  })
  return getLibraryPage(id)
}

export async function updateLibraryPage(input: { id: string; body: UpdateWebsitePageBody }) {
  const existing = await db(LIB.pages).where({ id: input.id }).first()
  if (!existing) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
  if (input.body.path != null && input.body.path !== existing.path) {
    const clash = await db(LIB.pages).where({ path: input.body.path }).whereNot({ id: input.id }).first()
    if (clash) throw new HttpError(409, 'A page with this path already exists', 'WEBSITE_PAGE_PATH_TAKEN')
  }
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.path != null) updates.path = input.body.path
  if (input.body.status != null) updates.status = input.body.status
  if (input.body.document != null) updates.document = JSON.stringify(input.body.document)
  if (input.body.sortOrder != null) updates.sort_order = input.body.sortOrder
  if (input.body.layoutId !== undefined) {
    updates.layout_id = await resolveLibraryLayoutId(input.body.layoutId)
  }
  await db(LIB.pages).where({ id: input.id }).update(updates)
  return getLibraryPage(input.id)
}

export async function deleteLibraryPage(id: string) {
  const deleted = await db(LIB.pages).where({ id }).delete()
  if (!deleted) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
}

export type LibraryChromeDto = {
  id: string
  companyId: string
  name: string
  isDefault: boolean
  isLocked: boolean
  document: WebsiteDocumentV1
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

type ChromeRow = {
  id: string
  name: string
  is_default: number | boolean
  document: unknown
  created_by: string | null
  created_at: Date
  updated_at: Date
}

function toChromeDto(row: ChromeRow): LibraryChromeDto {
  return {
    id: row.id,
    companyId: '',
    name: row.name,
    isDefault: toBool(row.is_default),
    isLocked: false,
    document: parseDocument(row.document),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listLibraryChrome(input: {
  kind: WebsiteChromeKind
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}) {
  const window = namedListWindow(input, 20)
  const query = likeName(db<ChromeRow>(chromeTable(input.kind)), 'name', input.q)
  applyNamesFilter(query, 'name', window.names)
  const total = await countOf(query)
  const rows = await query
    .clone()
    .orderBy('is_default', 'desc')
    .orderBy('updated_at', 'desc')
    .limit(window.pageSize)
    .offset(window.offset)
  return { items: rows.map(toChromeDto), total, page: window.page, pageSize: window.pageSize }
}

export async function getLibraryChrome(kind: WebsiteChromeKind, id: string) {
  const row = await db<ChromeRow>(chromeTable(kind)).where({ id }).first()
  if (!row) {
    throw new HttpError(404, 'Not found', kind === 'headers' ? 'WEBSITE_HEADER_NOT_FOUND' : 'WEBSITE_FOOTER_NOT_FOUND')
  }
  return toChromeDto(row)
}

export async function createLibraryChrome(input: {
  kind: WebsiteChromeKind
  userId: string
  body: CreateWebsiteChromeBody
}) {
  if (input.body.isDefault) await clearLibraryDefault(chromeTable(input.kind))
  const id = nanoid()
  await db(chromeTable(input.kind)).insert({
    id,
    name: input.body.name,
    is_default: input.body.isDefault,
    document: JSON.stringify(input.body.document),
    created_by: input.userId,
    ...stamp(),
  })
  return getLibraryChrome(input.kind, id)
}

export async function updateLibraryChrome(input: {
  kind: WebsiteChromeKind
  id: string
  body: UpdateWebsiteChromeBody
}) {
  const existing = await db(chromeTable(input.kind)).where({ id: input.id }).first()
  if (!existing) {
    throw new HttpError(404, 'Not found', input.kind === 'headers' ? 'WEBSITE_HEADER_NOT_FOUND' : 'WEBSITE_FOOTER_NOT_FOUND')
  }
  if (input.body.isDefault) await clearLibraryDefault(chromeTable(input.kind))
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.isDefault != null) updates.is_default = input.body.isDefault
  if (input.body.document != null) updates.document = JSON.stringify(input.body.document)
  await db(chromeTable(input.kind)).where({ id: input.id }).update(updates)
  return getLibraryChrome(input.kind, input.id)
}

export async function deleteLibraryChrome(kind: WebsiteChromeKind, id: string) {
  const deleted = await db(chromeTable(kind)).where({ id }).delete()
  if (!deleted) {
    throw new HttpError(404, 'Not found', kind === 'headers' ? 'WEBSITE_HEADER_NOT_FOUND' : 'WEBSITE_FOOTER_NOT_FOUND')
  }
}

export type LibraryPresetDto = {
  id: string
  companyId: string
  name: string
  document: WebsiteDocumentV1
  isLocked: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

type PresetRow = {
  id: string
  name: string
  document: unknown
  created_by: string | null
  created_at: Date
  updated_at: Date
}

function toPresetDto(row: PresetRow): LibraryPresetDto {
  return {
    id: row.id,
    companyId: '',
    name: row.name,
    document: parseDocument(row.document),
    isLocked: false,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listLibraryPresets(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}) {
  const window = namedListWindow(input, 20)
  const query = likeName(db<PresetRow>(LIB.presets), 'name', input.q)
  applyNamesFilter(query, 'name', window.names)
  const total = await countOf(query)
  const rows = await query.clone().orderBy('updated_at', 'desc').limit(window.pageSize).offset(window.offset)
  return { items: rows.map(toPresetDto), total, page: window.page, pageSize: window.pageSize }
}

export async function getLibraryPreset(id: string) {
  const row = await db<PresetRow>(LIB.presets).where({ id }).first()
  if (!row) throw new HttpError(404, 'Not found', 'WEBSITE_PRESET_NOT_FOUND')
  return toPresetDto(row)
}

export async function createLibraryPreset(input: { userId: string; body: CreateWebsitePresetBody }) {
  const id = nanoid()
  await db(LIB.presets).insert({
    id,
    name: input.body.name,
    document: JSON.stringify(input.body.document),
    created_by: input.userId,
    ...stamp(),
  })
  return getLibraryPreset(id)
}

export async function updateLibraryPreset(input: { id: string; body: UpdateWebsitePresetBody }) {
  const existing = await db(LIB.presets).where({ id: input.id }).first()
  if (!existing) throw new HttpError(404, 'Not found', 'WEBSITE_PRESET_NOT_FOUND')
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.document != null) updates.document = JSON.stringify(input.body.document)
  await db(LIB.presets).where({ id: input.id }).update(updates)
  return getLibraryPreset(input.id)
}

export async function deleteLibraryPreset(id: string) {
  const deleted = await db(LIB.presets).where({ id }).delete()
  if (!deleted) throw new HttpError(404, 'Not found', 'WEBSITE_PRESET_NOT_FOUND')
}

export type LibraryThemeDto = {
  id: string
  companyId: string
  name: string
  pageBackground: string
  bodyTextColor: string
  isActive: boolean
  isDefault: boolean
  isLocked: boolean
  fonts: WebsiteFontToken[]
  colors: WebsiteColorToken[]
  textStyles: WebsiteTextStyle[]
  buttonStyles: WebsiteButtonStyle[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

type ThemeRow = {
  id: string
  name: string
  page_background: string
  body_text_color: string
  is_active: number | boolean
  is_default: number | boolean
  fonts: unknown
  colors: unknown
  text_styles: unknown
  button_styles: unknown
  created_by: string | null
  created_at: Date
  updated_at: Date
}

function toThemeDto(row: ThemeRow): LibraryThemeDto {
  return {
    id: row.id,
    companyId: '',
    name: row.name,
    pageBackground: row.page_background,
    bodyTextColor: row.body_text_color,
    isActive: toBool(row.is_active),
    isDefault: toBool(row.is_default),
    isLocked: false,
    fonts: parseJsonArray<WebsiteFontToken>(row.fonts),
    colors: parseJsonArray<WebsiteColorToken>(row.colors),
    textStyles: parseJsonArray<WebsiteTextStyle>(row.text_styles),
    buttonStyles: parseJsonArray<WebsiteButtonStyle>(row.button_styles),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listLibraryThemes(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}) {
  const window = namedListWindow(input, 20)
  const query = likeName(db<ThemeRow>(LIB.themes), 'name', input.q)
  applyNamesFilter(query, 'name', window.names)
  const total = await countOf(query)
  const rows = await query
    .clone()
    .orderBy('is_default', 'desc')
    .orderBy('updated_at', 'desc')
    .limit(window.pageSize)
    .offset(window.offset)
  return { items: rows.map(toThemeDto), total, page: window.page, pageSize: window.pageSize }
}

export async function getLibraryTheme(id: string) {
  const row = await db<ThemeRow>(LIB.themes).where({ id }).first()
  if (!row) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  return toThemeDto(row)
}

export async function createLibraryTheme(input: { userId: string; body: CreateWebsiteThemeBody }) {
  if (input.body.isDefault) await clearLibraryDefault(LIB.themes)
  const id = nanoid()
  await db(LIB.themes).insert({
    id,
    name: input.body.name,
    page_background: input.body.pageBackground,
    body_text_color: input.body.bodyTextColor,
    is_active: input.body.isActive,
    is_default: input.body.isDefault,
    fonts: JSON.stringify(input.body.fonts),
    colors: JSON.stringify(input.body.colors),
    text_styles: JSON.stringify(input.body.textStyles),
    button_styles: JSON.stringify(input.body.buttonStyles),
    created_by: input.userId,
    ...stamp(),
  })
  return getLibraryTheme(id)
}

export async function updateLibraryTheme(input: { id: string; body: UpdateWebsiteThemeBody }) {
  const existing = await db(LIB.themes).where({ id: input.id }).first()
  if (!existing) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  if (input.body.isDefault) await clearLibraryDefault(LIB.themes)
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.pageBackground != null) updates.page_background = input.body.pageBackground
  if (input.body.bodyTextColor != null) updates.body_text_color = input.body.bodyTextColor
  if (input.body.isActive != null) updates.is_active = input.body.isActive
  if (input.body.isDefault != null) updates.is_default = input.body.isDefault
  if (input.body.fonts != null) updates.fonts = JSON.stringify(input.body.fonts)
  if (input.body.colors != null) updates.colors = JSON.stringify(input.body.colors)
  if (input.body.textStyles != null) updates.text_styles = JSON.stringify(input.body.textStyles)
  if (input.body.buttonStyles != null) updates.button_styles = JSON.stringify(input.body.buttonStyles)
  await db(LIB.themes).where({ id: input.id }).update(updates)
  return getLibraryTheme(input.id)
}

export async function deleteLibraryTheme(id: string) {
  const deleted = await db(LIB.themes).where({ id }).delete()
  if (!deleted) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
}

export type LibraryLayoutPageDto = {
  id: string
  name: string
  path: string
  status: WebsitePageStatus
  sortOrder: number
}

export type LibraryLayoutDto = {
  id: string
  companyId: string
  name: string
  headerId: string | null
  footerId: string | null
  themeId: string | null
  isDefault: boolean
  isLocked: boolean
  pages: LibraryLayoutPageDto[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

type LayoutRow = {
  id: string
  name: string
  header_id: string | null
  footer_id: string | null
  theme_id: string | null
  is_default: number | boolean
  created_by: string | null
  created_at: Date
  updated_at: Date
}

async function pagesForLibraryLayouts(layoutIds: string[]) {
  const grouped = new Map<string, LibraryLayoutPageDto[]>()
  if (layoutIds.length === 0) return grouped
  const rows = await db<PageRow>(LIB.pages).whereIn('layout_id', layoutIds).orderBy('sort_order', 'asc').orderBy('name', 'asc')
  for (const row of rows) {
    if (!row.layout_id) continue
    const list = grouped.get(row.layout_id) ?? []
    list.push({
      id: row.id,
      name: row.name,
      path: row.path,
      status: row.status,
      sortOrder: row.sort_order,
    })
    grouped.set(row.layout_id, list)
  }
  return grouped
}

function toLayoutDto(row: LayoutRow, pages: LibraryLayoutPageDto[]): LibraryLayoutDto {
  return {
    id: row.id,
    companyId: '',
    name: row.name,
    headerId: row.header_id,
    footerId: row.footer_id,
    themeId: row.theme_id,
    isDefault: toBool(row.is_default),
    isLocked: false,
    pages,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listLibraryLayouts(input: {
  page?: number
  pageSize?: number
  q?: string
  names?: string | string[]
}) {
  const window = namedListWindow(input, 20)
  const query = likeName(db<LayoutRow>(LIB.layouts), 'name', input.q)
  applyNamesFilter(query, 'name', window.names)
  const total = await countOf(query)
  const rows = (await query
    .clone()
    .orderBy('is_default', 'desc')
    .orderBy('updated_at', 'desc')
    .limit(window.pageSize)
    .offset(window.offset)) as LayoutRow[]
  const grouped = await pagesForLibraryLayouts(rows.map((row) => row.id))
  return {
    items: rows.map((row) => toLayoutDto(row, grouped.get(row.id) ?? [])),
    total,
    page: window.page,
    pageSize: window.pageSize,
  }
}

export async function getLibraryLayout(id: string) {
  const row = await db<LayoutRow>(LIB.layouts).where({ id }).first()
  if (!row) throw new HttpError(404, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
  const grouped = await pagesForLibraryLayouts([row.id])
  return toLayoutDto(row, grouped.get(row.id) ?? [])
}

async function applyLibraryPageOrder(layoutId: string, pageIds: string[]) {
  const assigned = await db(LIB.pages).where({ layout_id: layoutId }).select<{ id: string }[]>('id')
  const assignedIds = new Set(assigned.map((row) => row.id))
  const ordered = pageIds.filter((id) => assignedIds.has(id))
  await Promise.all(
    ordered.map((id, index) =>
      db(LIB.pages).where({ id }).update({ sort_order: index, updated_at: db.fn.now(3) }),
    ),
  )
}

export async function createLibraryLayout(input: { userId: string; body: CreateWebsiteLayoutBody }) {
  await assertLibraryRow(LIB.headers, input.body.headerId, 'Header not found', 'WEBSITE_HEADER_NOT_FOUND')
  await assertLibraryRow(LIB.footers, input.body.footerId, 'Footer not found', 'WEBSITE_FOOTER_NOT_FOUND')
  await assertLibraryRow(LIB.themes, input.body.themeId, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  const existingDefault = await db(LIB.layouts).where({ is_default: true }).first()
  const isDefault = Boolean(input.body.isDefault) || !existingDefault
  if (isDefault) await clearLibraryDefault(LIB.layouts)
  const id = nanoid()
  await db(LIB.layouts).insert({
    id,
    name: input.body.name,
    header_id: input.body.headerId ?? null,
    footer_id: input.body.footerId ?? null,
    theme_id: input.body.themeId ?? null,
    is_default: isDefault,
    created_by: input.userId,
    ...stamp(),
  })
  if (input.body.pageIds?.length) await applyLibraryPageOrder(id, input.body.pageIds)
  return getLibraryLayout(id)
}

export async function updateLibraryLayout(input: { id: string; body: UpdateWebsiteLayoutBody }) {
  const existing = await db(LIB.layouts).where({ id: input.id }).first()
  if (!existing) throw new HttpError(404, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
  if (input.body.headerId !== undefined) {
    await assertLibraryRow(LIB.headers, input.body.headerId, 'Header not found', 'WEBSITE_HEADER_NOT_FOUND')
  }
  if (input.body.footerId !== undefined) {
    await assertLibraryRow(LIB.footers, input.body.footerId, 'Footer not found', 'WEBSITE_FOOTER_NOT_FOUND')
  }
  if (input.body.themeId !== undefined) {
    await assertLibraryRow(LIB.themes, input.body.themeId, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  }
  if (input.body.isDefault) await clearLibraryDefault(LIB.layouts)
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.headerId !== undefined) updates.header_id = input.body.headerId
  if (input.body.footerId !== undefined) updates.footer_id = input.body.footerId
  if (input.body.themeId !== undefined) updates.theme_id = input.body.themeId
  if (input.body.isDefault != null) updates.is_default = input.body.isDefault
  await db(LIB.layouts).where({ id: input.id }).update(updates)
  if (input.body.pageIds) await applyLibraryPageOrder(input.id, input.body.pageIds)
  return getLibraryLayout(input.id)
}

export async function deleteLibraryLayout(id: string) {
  const deleted = await db(LIB.layouts).where({ id }).delete()
  if (!deleted) throw new HttpError(404, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
}

async function availableName(conn: Sql, table: string, companyId: string, name: string): Promise<string> {
  const base = name.trim() || 'Item'
  for (let n = 0; n < 40; n += 1) {
    const candidate = (n === 0 ? base : n === 1 ? `${base} copy` : `${base} copy ${n}`).slice(0, 255)
    const row = await conn(table).where({ company_id: companyId, name: candidate }).first()
    if (!row) return candidate
  }
  throw new HttpError(409, 'Could not choose a unique name', 'WEBSITE_LIBRARY_NAME')
}

async function availablePagePath(conn: Sql, companyId: string, path: string): Promise<string> {
  const original = (path ?? '').slice(0, 128)
  const base = (original || 'page').toLowerCase().replace(/[^a-z0-9/-]/g, '').slice(0, 100) || 'page'
  for (let i = 0; i < 12; i += 1) {
    const candidate = i === 0 ? original : `${base}-copy-${Math.random().toString(36).slice(2, 6)}`.slice(0, 128)
    const row = await conn(COMPANY.pages).where({ company_id: companyId, path: candidate }).first()
    if (!row) return candidate
  }
  throw new HttpError(409, 'A page with this path already exists', 'WEBSITE_PAGE_PATH_TAKEN')
}

async function copyThemeRow(conn: Sql, input: { companyId: string; userId: string; libraryId: string }) {
  const source = await conn<ThemeRow>(LIB.themes).where({ id: input.libraryId }).first()
  if (!source) throw new HttpError(404, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  const id = nanoid()
  await conn(COMPANY.themes).insert({
    id,
    company_id: input.companyId,
    name: await availableName(conn, COMPANY.themes, input.companyId, source.name),
    page_background: source.page_background,
    body_text_color: source.body_text_color,
    is_active: true,
    is_default: false,
    is_locked: false,
    fonts: JSON.stringify(parseJsonArray(source.fonts)),
    colors: JSON.stringify(parseJsonArray(source.colors)),
    text_styles: JSON.stringify(parseJsonArray(source.text_styles)),
    button_styles: JSON.stringify(parseJsonArray(source.button_styles)),
    source_library_id: source.id,
    created_by: input.userId,
    ...stamp(),
  })
  return id
}

async function copyChromeRow(
  conn: Sql,
  input: { kind: WebsiteChromeKind; companyId: string; userId: string; libraryId: string },
) {
  const source = await conn<ChromeRow>(chromeTable(input.kind)).where({ id: input.libraryId }).first()
  if (!source) {
    throw new HttpError(404, 'Not found', input.kind === 'headers' ? 'WEBSITE_HEADER_NOT_FOUND' : 'WEBSITE_FOOTER_NOT_FOUND')
  }
  const id = nanoid()
  const document = detachCompanyDocumentRefs(parseDocument(source.document))
  await conn(companyChromeTable(input.kind)).insert({
    id,
    company_id: input.companyId,
    name: await availableName(conn, companyChromeTable(input.kind), input.companyId, source.name),
    is_default: false,
    is_locked: false,
    document: JSON.stringify(document),
    source_library_id: source.id,
    created_by: input.userId,
    ...stamp(),
  })
  return id
}

async function copyLayoutRow(conn: Sql, input: { companyId: string; userId: string; libraryId: string }) {
  const source = await conn<LayoutRow>(LIB.layouts).where({ id: input.libraryId }).first()
  if (!source) throw new HttpError(404, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
  const headerId = source.header_id
    ? await copyChromeRow(conn, { kind: 'headers', companyId: input.companyId, userId: input.userId, libraryId: source.header_id })
    : null
  const footerId = source.footer_id
    ? await copyChromeRow(conn, { kind: 'footers', companyId: input.companyId, userId: input.userId, libraryId: source.footer_id })
    : null
  const themeId = source.theme_id
    ? await copyThemeRow(conn, { companyId: input.companyId, userId: input.userId, libraryId: source.theme_id })
    : null
  const id = nanoid()
  await conn(COMPANY.layouts).insert({
    id,
    company_id: input.companyId,
    name: await availableName(conn, COMPANY.layouts, input.companyId, source.name),
    header_id: headerId,
    footer_id: footerId,
    theme_id: themeId,
    is_default: false,
    is_locked: false,
    source_library_id: source.id,
    created_by: input.userId,
    ...stamp(),
  })
  return id
}

export async function copyLibraryTheme(input: { companyId: string; userId: string; libraryId: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  const id = await db.transaction((trx) => copyThemeRow(trx, input))
  const { getWebsiteTheme } = await import('./websiteTheme.service.js')
  return getWebsiteTheme({ companyId: input.companyId, id })
}

export async function copyLibraryChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
  userId: string
  libraryId: string
}) {
  await getCompanyFromWebOnOne(input.companyId)
  const id = await db.transaction((trx) => copyChromeRow(trx, input))
  const { getWebsiteChrome } = await import('./websiteChrome.service.js')
  return getWebsiteChrome({ kind: input.kind, companyId: input.companyId, id })
}

export async function copyLibraryPreset(input: { companyId: string; userId: string; libraryId: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  const id = await db.transaction(async (trx) => {
    const source = await trx<PresetRow>(LIB.presets).where({ id: input.libraryId }).first()
    if (!source) throw new HttpError(404, 'Not found', 'WEBSITE_PRESET_NOT_FOUND')
    const presetId = nanoid()
    await trx(COMPANY.presets).insert({
      id: presetId,
      company_id: input.companyId,
      name: await availableName(trx, COMPANY.presets, input.companyId, source.name),
      document: JSON.stringify(detachCompanyDocumentRefs(parseDocument(source.document))),
      is_locked: false,
      source_library_id: source.id,
      created_by: input.userId,
      ...stamp(),
    })
    return presetId
  })
  const { getWebsitePreset } = await import('./websitePreset.service.js')
  return getWebsitePreset({ companyId: input.companyId, id })
}

export async function copyLibraryLayout(input: { companyId: string; userId: string; libraryId: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  const id = await db.transaction((trx) => copyLayoutRow(trx, input))
  const { getWebsiteLayout } = await import('./websiteLayout.service.js')
  return getWebsiteLayout({ companyId: input.companyId, id })
}

export async function copyLibraryPage(input: { companyId: string; userId: string; libraryId: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  const id = await db.transaction(async (trx) => {
    const source = await trx<PageRow>(LIB.pages).where({ id: input.libraryId }).first()
    if (!source) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
    const layoutId = source.layout_id
      ? await copyLayoutRow(trx, { companyId: input.companyId, userId: input.userId, libraryId: source.layout_id })
      : null
    const pageId = nanoid()
    const sortRow = layoutId
      ? await trx(COMPANY.pages).where({ company_id: input.companyId, layout_id: layoutId }).max<{ max: number | null }>('sort_order as max').first()
      : null
    await trx(COMPANY.pages).insert({
      id: pageId,
      company_id: input.companyId,
      name: await availableName(trx, COMPANY.pages, input.companyId, source.name),
      path: await availablePagePath(trx, input.companyId, source.path),
      status: 'active',
      layout_id: layoutId,
      sort_order: Number(sortRow?.max ?? -1) + 1,
      document: JSON.stringify(detachCompanyDocumentRefs(parseDocument(source.document))),
      is_locked: false,
      source_library_id: source.id,
      created_by: input.userId,
      ...stamp(),
    })
    return pageId
  })
  const { getWebsitePage } = await import('./websitePage.service.js')
  return getWebsitePage({ companyId: input.companyId, id })
}

type CompanySourceRow = {
  id: string
  company_id: string
  source_library_id: string | null
  is_locked: number | boolean
}

function libraryMissing(code: string): HttpError {
  return new HttpError(404, 'Library item not found', code)
}

async function requireLibraryCopy(
  conn: Sql,
  table: string,
  companyId: string,
  id: string,
  notFoundCode: string,
): Promise<string> {
  const row = await conn<CompanySourceRow>(table).where({ id, company_id: companyId }).first()
  if (!row) throw new HttpError(404, 'Not found', notFoundCode)
  assertWebsiteUnlocked(row.is_locked)
  if (!row.source_library_id) {
    throw new HttpError(409, 'This item was not added from the library', 'WEBSITE_LIBRARY_SOURCE_MISSING')
  }
  return row.source_library_id
}

function documentJson(raw: unknown): string {
  return JSON.stringify(detachCompanyDocumentRefs(parseDocument(raw)))
}

async function findCompanyCopyId(
  conn: Sql,
  table: string,
  companyId: string,
  libraryId: string,
  preferredId: string | null,
): Promise<string | null> {
  if (preferredId) {
    const preferred = await conn<CompanySourceRow>(table).where({ id: preferredId, company_id: companyId }).first()
    if (preferred?.source_library_id === libraryId && !isLockedFlag(preferred.is_locked)) return preferred.id
  }
  const existing = await conn<CompanySourceRow>(table)
    .where({ company_id: companyId, source_library_id: libraryId })
    .orderBy('updated_at', 'desc')
    .first()
  if (!existing || isLockedFlag(existing.is_locked)) return null
  return existing.id
}

async function restoreCompanyChrome(
  conn: Sql,
  input: {
    kind: WebsiteChromeKind
    companyId: string
    userId: string
    libraryId: string | null
    preferredId: string | null
  },
): Promise<string | null> {
  if (!input.libraryId) return null
  const source = await conn<ChromeRow>(chromeTable(input.kind)).where({ id: input.libraryId }).first()
  if (!source) return null
  const existingId = await findCompanyCopyId(
    conn,
    companyChromeTable(input.kind),
    input.companyId,
    input.libraryId,
    input.preferredId,
  )
  if (!existingId) {
    return copyChromeRow(conn, {
      kind: input.kind,
      companyId: input.companyId,
      userId: input.userId,
      libraryId: input.libraryId,
    })
  }
  await conn(companyChromeTable(input.kind)).where({ id: existingId }).update({
    document: documentJson(source.document),
    updated_at: db.fn.now(3),
  })
  return existingId
}

async function restoreCompanyTheme(
  conn: Sql,
  input: { companyId: string; userId: string; libraryId: string | null; preferredId: string | null },
): Promise<string | null> {
  if (!input.libraryId) return null
  const source = await conn<ThemeRow>(LIB.themes).where({ id: input.libraryId }).first()
  if (!source) return null
  const existingId = await findCompanyCopyId(conn, COMPANY.themes, input.companyId, input.libraryId, input.preferredId)
  if (!existingId) {
    return copyThemeRow(conn, { companyId: input.companyId, userId: input.userId, libraryId: input.libraryId })
  }
  await conn(COMPANY.themes).where({ id: existingId }).update({
    page_background: source.page_background,
    body_text_color: source.body_text_color,
    fonts: JSON.stringify(parseJsonArray(source.fonts)),
    colors: JSON.stringify(parseJsonArray(source.colors)),
    text_styles: JSON.stringify(parseJsonArray(source.text_styles)),
    button_styles: JSON.stringify(parseJsonArray(source.button_styles)),
    updated_at: db.fn.now(3),
  })
  return existingId
}

export async function revertLibraryPage(input: { companyId: string; id: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  await db.transaction(async (trx) => {
    const libraryId = await requireLibraryCopy(trx, COMPANY.pages, input.companyId, input.id, 'WEBSITE_PAGE_NOT_FOUND')
    const source = await trx<PageRow>(LIB.pages).where({ id: libraryId }).first()
    if (!source) throw libraryMissing('WEBSITE_PAGE_NOT_FOUND')
    await trx(COMPANY.pages).where({ id: input.id }).update({
      document: documentJson(source.document),
      updated_at: db.fn.now(3),
    })
  })
  const { getWebsitePage } = await import('./websitePage.service.js')
  return getWebsitePage({ companyId: input.companyId, id: input.id })
}

export async function revertLibraryChrome(input: { kind: WebsiteChromeKind; companyId: string; id: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  const notFound = input.kind === 'headers' ? 'WEBSITE_HEADER_NOT_FOUND' : 'WEBSITE_FOOTER_NOT_FOUND'
  await db.transaction(async (trx) => {
    const libraryId = await requireLibraryCopy(trx, companyChromeTable(input.kind), input.companyId, input.id, notFound)
    const source = await trx<ChromeRow>(chromeTable(input.kind)).where({ id: libraryId }).first()
    if (!source) throw libraryMissing(notFound)
    await trx(companyChromeTable(input.kind)).where({ id: input.id }).update({
      document: documentJson(source.document),
      updated_at: db.fn.now(3),
    })
  })
  const { getWebsiteChrome } = await import('./websiteChrome.service.js')
  return getWebsiteChrome({ kind: input.kind, companyId: input.companyId, id: input.id })
}

export async function revertLibraryPreset(input: { companyId: string; id: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  await db.transaction(async (trx) => {
    const libraryId = await requireLibraryCopy(trx, COMPANY.presets, input.companyId, input.id, 'WEBSITE_PRESET_NOT_FOUND')
    const source = await trx<PresetRow>(LIB.presets).where({ id: libraryId }).first()
    if (!source) throw libraryMissing('WEBSITE_PRESET_NOT_FOUND')
    await trx(COMPANY.presets).where({ id: input.id }).update({
      document: documentJson(source.document),
      updated_at: db.fn.now(3),
    })
  })
  const { getWebsitePreset } = await import('./websitePreset.service.js')
  return getWebsitePreset({ companyId: input.companyId, id: input.id })
}

export async function revertLibraryTheme(input: { companyId: string; id: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  await db.transaction(async (trx) => {
    const libraryId = await requireLibraryCopy(trx, COMPANY.themes, input.companyId, input.id, 'WEBSITE_THEME_NOT_FOUND')
    const source = await trx<ThemeRow>(LIB.themes).where({ id: libraryId }).first()
    if (!source) throw libraryMissing('WEBSITE_THEME_NOT_FOUND')
    await trx(COMPANY.themes).where({ id: input.id }).update({
      page_background: source.page_background,
      body_text_color: source.body_text_color,
      fonts: JSON.stringify(parseJsonArray(source.fonts)),
      colors: JSON.stringify(parseJsonArray(source.colors)),
      text_styles: JSON.stringify(parseJsonArray(source.text_styles)),
      button_styles: JSON.stringify(parseJsonArray(source.button_styles)),
      updated_at: db.fn.now(3),
    })
  })
  const { getWebsiteTheme } = await import('./websiteTheme.service.js')
  return getWebsiteTheme({ companyId: input.companyId, id: input.id })
}

export async function revertLibraryLayout(input: { companyId: string; userId: string; id: string }) {
  await getCompanyFromWebOnOne(input.companyId)
  await db.transaction(async (trx) => {
    const libraryId = await requireLibraryCopy(trx, COMPANY.layouts, input.companyId, input.id, 'WEBSITE_LAYOUT_NOT_FOUND')
    const source = await trx<LayoutRow>(LIB.layouts).where({ id: libraryId }).first()
    if (!source) throw libraryMissing('WEBSITE_LAYOUT_NOT_FOUND')
    const current = await trx<{ id: string; header_id: string | null; footer_id: string | null; theme_id: string | null }>(
      COMPANY.layouts,
    )
      .where({ id: input.id })
      .first()
    const headerId = await restoreCompanyChrome(trx, {
      kind: 'headers',
      companyId: input.companyId,
      userId: input.userId,
      libraryId: source.header_id,
      preferredId: current?.header_id ?? null,
    })
    const footerId = await restoreCompanyChrome(trx, {
      kind: 'footers',
      companyId: input.companyId,
      userId: input.userId,
      libraryId: source.footer_id,
      preferredId: current?.footer_id ?? null,
    })
    const themeId = await restoreCompanyTheme(trx, {
      companyId: input.companyId,
      userId: input.userId,
      libraryId: source.theme_id,
      preferredId: current?.theme_id ?? null,
    })
    await trx(COMPANY.layouts).where({ id: input.id }).update({
      header_id: headerId,
      footer_id: footerId,
      theme_id: themeId,
      updated_at: db.fn.now(3),
    })
  })
  const { getWebsiteLayout } = await import('./websiteLayout.service.js')
  return getWebsiteLayout({ companyId: input.companyId, id: input.id })
}
