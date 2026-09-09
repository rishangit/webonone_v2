import { nanoid } from 'nanoid'
import { db, type DesignWebsiteLayoutRow, type DesignWebsitePageRow } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import type { CreateWebsiteLayoutBody, UpdateWebsiteLayoutBody } from '../schemas/websiteLayouts.schema.js'
import type { WebsitePageStatus } from '../models/db.js'

export type WebsiteLayoutPageDto = {
  id: string
  name: string
  path: string
  status: WebsitePageStatus
  sortOrder: number
}

export type WebsiteLayoutDto = {
  id: string
  companyId: string
  name: string
  headerId: string | null
  footerId: string | null
  themeId: string | null
  isDefault: boolean
  pages: WebsiteLayoutPageDto[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function toBool(value: number | boolean): boolean {
  return value === true || value === 1
}

function toLayoutDto(row: DesignWebsiteLayoutRow, pages: WebsiteLayoutPageDto[]): WebsiteLayoutDto {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    headerId: row.header_id,
    footerId: row.footer_id,
    themeId: row.theme_id,
    isDefault: toBool(row.is_default),
    pages,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

function toPageDto(row: DesignWebsitePageRow): WebsiteLayoutPageDto {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    status: row.status,
    sortOrder: row.sort_order,
  }
}

async function pagesForLayouts(companyId: string, layoutIds: string[]): Promise<Map<string, WebsiteLayoutPageDto[]>> {
  const grouped = new Map<string, WebsiteLayoutPageDto[]>()
  if (layoutIds.length === 0) return grouped
  const rows = await db<DesignWebsitePageRow>('design_website_pages')
    .where({ company_id: companyId })
    .whereIn('layout_id', layoutIds)
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc')
  for (const row of rows) {
    if (!row.layout_id) continue
    const list = grouped.get(row.layout_id) ?? []
    list.push(toPageDto(row))
    grouped.set(row.layout_id, list)
  }
  return grouped
}

async function assertChromeBelongs(input: {
  kind: 'headers' | 'footers'
  companyId: string
  id: string | null | undefined
}): Promise<void> {
  if (!input.id) return
  const table = input.kind === 'headers' ? 'design_website_headers' : 'design_website_footers'
  const row = await db(table).where({ id: input.id, company_id: input.companyId }).first()
  if (!row) {
    throw new HttpError(
      400,
      input.kind === 'headers' ? 'Header not found' : 'Footer not found',
      input.kind === 'headers' ? 'WEBSITE_HEADER_NOT_FOUND' : 'WEBSITE_FOOTER_NOT_FOUND',
    )
  }
}

async function assertThemeBelongs(input: {
  companyId: string
  id: string | null | undefined
}): Promise<void> {
  if (!input.id) return
  const row = await db('design_website_themes').where({ id: input.id, company_id: input.companyId }).first()
  if (!row) {
    throw new HttpError(400, 'Theme not found', 'WEBSITE_THEME_NOT_FOUND')
  }
}

async function defaultThemeId(companyId: string): Promise<string | null> {
  const row =
    (await db('design_website_themes')
      .where({ company_id: companyId, is_default: true, is_active: true })
      .select('id')
      .first()) ??
    (await db('design_website_themes')
      .where({ company_id: companyId, is_active: true })
      .orderBy('updated_at', 'desc')
      .select('id')
      .first())
  return row?.id ?? null
}

async function clearDefaults(companyId: string): Promise<void> {
  await db('design_website_layouts').where({ company_id: companyId }).update({ is_default: false })
}

async function applyPageOrder(input: { companyId: string; layoutId: string; pageIds: string[] }): Promise<void> {
  const assigned = await db<DesignWebsitePageRow>('design_website_pages')
    .where({ company_id: input.companyId, layout_id: input.layoutId })
    .select('id')
  const assignedIds = new Set(assigned.map((row) => row.id))
  const ordered = input.pageIds.filter((id) => assignedIds.has(id))
  await Promise.all(
    ordered.map((id, index) =>
      db('design_website_pages').where({ id, company_id: input.companyId }).update({
        sort_order: index,
        updated_at: db.fn.now(3),
      }),
    ),
  )
}

export async function listWebsiteLayouts(input: {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
}): Promise<{ items: WebsiteLayoutDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize
  let query = db<DesignWebsiteLayoutRow>('design_website_layouts').where({
    company_id: input.companyId,
  })
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(name) LIKE ?', [q])
    })
  }
  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query.clone().orderBy('is_default', 'desc').orderBy('updated_at', 'desc').limit(pageSize).offset(offset)
  const grouped = await pagesForLayouts(
    input.companyId,
    rows.map((row) => row.id),
  )
  return {
    items: rows.map((row) => toLayoutDto(row, grouped.get(row.id) ?? [])),
    total,
    page,
    pageSize,
  }
}

export async function getWebsiteLayout(input: { companyId: string; id: string }): Promise<WebsiteLayoutDto> {
  const row = await db<DesignWebsiteLayoutRow>('design_website_layouts')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!row) throw new HttpError(404, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
  const grouped = await pagesForLayouts(input.companyId, [row.id])
  return toLayoutDto(row, grouped.get(row.id) ?? [])
}

export async function getDefaultWebsiteLayout(input: { companyId: string }): Promise<WebsiteLayoutDto | null> {
  const row = await db<DesignWebsiteLayoutRow>('design_website_layouts')
    .where({ company_id: input.companyId, is_default: true })
    .first()
  if (!row) return null
  const grouped = await pagesForLayouts(input.companyId, [row.id])
  return toLayoutDto(row, grouped.get(row.id) ?? [])
}

export async function createWebsiteLayout(input: {
  companyId: string
  userId: string
  body: CreateWebsiteLayoutBody
}): Promise<WebsiteLayoutDto> {
  await getCompanyFromWebOnOne(input.companyId)
  await assertChromeBelongs({ kind: 'headers', companyId: input.companyId, id: input.body.headerId })
  await assertChromeBelongs({ kind: 'footers', companyId: input.companyId, id: input.body.footerId })
  await assertThemeBelongs({ companyId: input.companyId, id: input.body.themeId })
  const themeId =
    input.body.themeId === undefined ? await defaultThemeId(input.companyId) : input.body.themeId
  const existingDefault = await db('design_website_layouts')
    .where({ company_id: input.companyId, is_default: true })
    .first()
  const isDefault = Boolean(input.body.isDefault) || !existingDefault
  if (isDefault) await clearDefaults(input.companyId)
  const id = nanoid()
  await db('design_website_layouts').insert({
    id,
    company_id: input.companyId,
    name: input.body.name,
    header_id: input.body.headerId ?? null,
    footer_id: input.body.footerId ?? null,
    theme_id: themeId,
    is_default: isDefault,
    created_by: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  if (isDefault) {
    const orphans = await db<DesignWebsitePageRow>('design_website_pages')
      .where({ company_id: input.companyId })
      .whereNull('layout_id')
      .orderBy('created_at', 'asc')
      .select('id')
    await Promise.all(
      orphans.map((page, index) =>
        db('design_website_pages').where({ id: page.id }).update({
          layout_id: id,
          sort_order: index,
          updated_at: db.fn.now(3),
        }),
      ),
    )
  }
  if (input.body.pageIds?.length) {
    await applyPageOrder({ companyId: input.companyId, layoutId: id, pageIds: input.body.pageIds })
  }
  return getWebsiteLayout({ companyId: input.companyId, id })
}

export async function updateWebsiteLayout(input: {
  companyId: string
  id: string
  body: UpdateWebsiteLayoutBody
}): Promise<WebsiteLayoutDto> {
  const existing = await db<DesignWebsiteLayoutRow>('design_website_layouts')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
  if (input.body.headerId !== undefined) {
    await assertChromeBelongs({ kind: 'headers', companyId: input.companyId, id: input.body.headerId })
  }
  if (input.body.footerId !== undefined) {
    await assertChromeBelongs({ kind: 'footers', companyId: input.companyId, id: input.body.footerId })
  }
  if (input.body.themeId !== undefined) {
    await assertThemeBelongs({ companyId: input.companyId, id: input.body.themeId })
  }
  if (input.body.isDefault) await clearDefaults(input.companyId)
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.headerId !== undefined) updates.header_id = input.body.headerId
  if (input.body.footerId !== undefined) updates.footer_id = input.body.footerId
  if (input.body.themeId !== undefined) updates.theme_id = input.body.themeId
  if (input.body.isDefault != null) updates.is_default = input.body.isDefault
  await db('design_website_layouts').where({ id: input.id }).update(updates)
  if (input.body.pageIds) {
    await applyPageOrder({ companyId: input.companyId, layoutId: input.id, pageIds: input.body.pageIds })
  }
  return getWebsiteLayout({ companyId: input.companyId, id: input.id })
}

export async function setDefaultWebsiteLayout(input: { companyId: string; id: string }): Promise<WebsiteLayoutDto> {
  return updateWebsiteLayout({
    companyId: input.companyId,
    id: input.id,
    body: { isDefault: true },
  })
}

export async function deleteWebsiteLayout(input: { companyId: string; id: string }): Promise<void> {
  const existing = await db<DesignWebsiteLayoutRow>('design_website_layouts')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Layout not found', 'WEBSITE_LAYOUT_NOT_FOUND')
  const inUse = await db('design_website_pages').where({ layout_id: input.id, company_id: input.companyId }).first()
  if (inUse) {
    throw new HttpError(409, 'Reassign pages before deleting this layout', 'WEBSITE_LAYOUT_IN_USE')
  }
  await db('design_website_layouts').where({ id: input.id, company_id: input.companyId }).del()
}

export async function countLayoutsUsingChrome(input: {
  kind: 'headers' | 'footers'
  companyId: string
  id: string
}): Promise<number> {
  const column = input.kind === 'headers' ? 'header_id' : 'footer_id'
  const row = await db('design_website_layouts')
    .where({ company_id: input.companyId, [column]: input.id })
    .count<{ count: number | string }[]>({ count: '*' })
    .first()
  return Number(row?.count ?? 0)
}

export async function countLayoutsUsingTheme(input: { companyId: string; id: string }): Promise<number> {
  const row = await db('design_website_layouts')
    .where({ company_id: input.companyId, theme_id: input.id })
    .count<{ count: number | string }[]>({ count: '*' })
    .first()
  return Number(row?.count ?? 0)
}

export async function nextPageSortOrder(input: { companyId: string; layoutId: string }): Promise<number> {
  const row = await db('design_website_pages')
    .where({ company_id: input.companyId, layout_id: input.layoutId })
    .max<{ max: number | string | null }[]>('sort_order as max')
    .first()
  return Number(row?.max ?? -1) + 1
}

export async function resolveLayoutForPage(input: {
  companyId: string
  layoutId: string | null
}): Promise<WebsiteLayoutDto | null> {
  if (input.layoutId) {
    try {
      return await getWebsiteLayout({ companyId: input.companyId, id: input.layoutId })
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        return getDefaultWebsiteLayout({ companyId: input.companyId })
      }
      throw err
    }
  }
  return getDefaultWebsiteLayout({ companyId: input.companyId })
}
