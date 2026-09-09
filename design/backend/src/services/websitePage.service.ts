import { nanoid } from 'nanoid'
import { db, type DesignWebsitePageRow, type WebsitePageStatus } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { emptyWebsiteDocument, websiteDocumentSchema, type WebsiteDocumentV1 } from '../schemas/websiteDocument.schema.js'
import type { CreateWebsitePageBody, UpdateWebsitePageBody } from '../schemas/websitePages.schema.js'
import {
  getDefaultWebsiteLayout,
  getWebsiteLayout,
  nextPageSortOrder,
} from './websiteLayout.service.js'

export type WebsitePageDto = {
  id: string
  companyId: string
  name: string
  path: string
  status: WebsitePageStatus
  layoutId: string | null
  layoutName: string | null
  sortOrder: number
  document: WebsiteDocumentV1
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

type PageRowWithLayout = DesignWebsitePageRow & { layout_name?: string | null }

function parseDocument(raw: DesignWebsitePageRow['document']): WebsiteDocumentV1 {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  const parsed = websiteDocumentSchema.safeParse(value)
  return parsed.success ? parsed.data : emptyWebsiteDocument()
}

function toDto(row: PageRowWithLayout): WebsitePageDto {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    path: row.path,
    status: row.status,
    layoutId: row.layout_id,
    layoutName: row.layout_name ?? null,
    sortOrder: row.sort_order ?? 0,
    document: parseDocument(row.document),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

async function resolveLayoutId(input: {
  companyId: string
  layoutId: string | null | undefined
}): Promise<string | null> {
  if (input.layoutId) {
    await getWebsiteLayout({ companyId: input.companyId, id: input.layoutId })
    return input.layoutId
  }
  if (input.layoutId === null) return null
  const fallback = await getDefaultWebsiteLayout({ companyId: input.companyId })
  return fallback?.id ?? null
}

export async function listWebsitePages(input: {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
  status?: WebsitePageStatus
}): Promise<{ items: WebsitePageDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize

  let query = db<PageRowWithLayout>('design_website_pages as p')
    .leftJoin('design_website_layouts as l', 'l.id', 'p.layout_id')
    .where('p.company_id', input.companyId)
  if (input.status) {
    query = query.andWhere('p.status', input.status)
  }
  if (input.q?.trim()) {
    const q = `%${input.q.trim().toLowerCase()}%`
    query = query.andWhere((builder) => {
      builder.whereRaw('LOWER(p.name) LIKE ?', [q]).orWhereRaw('LOWER(p.path) LIKE ?', [q])
    })
  }

  const countRow = await query.clone().count<{ count: number | string }[]>({ count: '*' }).first()
  const total = Number(countRow?.count ?? 0)
  const rows = await query
    .clone()
    .select('p.*', 'l.name as layout_name')
    .orderBy('p.updated_at', 'desc')
    .limit(pageSize)
    .offset(offset)
  return { items: rows.map(toDto), total, page, pageSize }
}

export async function getWebsitePage(input: { companyId: string; id: string }): Promise<WebsitePageDto> {
  const row = await db<PageRowWithLayout>('design_website_pages as p')
    .leftJoin('design_website_layouts as l', 'l.id', 'p.layout_id')
    .select('p.*', 'l.name as layout_name')
    .where('p.id', input.id)
    .andWhere('p.company_id', input.companyId)
    .first()
  if (!row) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
  return toDto(row)
}

export async function getWebsitePageByPath(input: {
  companyId: string
  path: string
}): Promise<WebsitePageDto> {
  const row = await db<PageRowWithLayout>('design_website_pages as p')
    .leftJoin('design_website_layouts as l', 'l.id', 'p.layout_id')
    .select('p.*', 'l.name as layout_name')
    .where('p.company_id', input.companyId)
    .andWhere('p.path', input.path)
    .andWhere('p.status', 'active')
    .first()
  if (!row) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
  return toDto(row)
}

export async function createWebsitePage(input: {
  companyId: string
  userId: string
  body: CreateWebsitePageBody
}): Promise<WebsitePageDto> {
  await getCompanyFromWebOnOne(input.companyId)
  const existing = await db('design_website_pages')
    .where({ company_id: input.companyId, path: input.body.path })
    .first()
  if (existing) {
    throw new HttpError(409, 'A page with this path already exists', 'WEBSITE_PAGE_PATH_TAKEN')
  }
  const layoutId = await resolveLayoutId({ companyId: input.companyId, layoutId: input.body.layoutId })
  const sortOrder = layoutId
    ? await nextPageSortOrder({ companyId: input.companyId, layoutId })
    : 0
  const id = nanoid()
  await db('design_website_pages').insert({
    id,
    company_id: input.companyId,
    name: input.body.name,
    path: input.body.path,
    status: input.body.status,
    layout_id: layoutId,
    sort_order: sortOrder,
    document: JSON.stringify(input.body.document),
    created_by: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  return getWebsitePage({ companyId: input.companyId, id })
}

export async function updateWebsitePage(input: {
  companyId: string
  id: string
  body: UpdateWebsitePageBody
}): Promise<WebsitePageDto> {
  const existing = await db<DesignWebsitePageRow>('design_website_pages')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
  if (input.body.path != null && input.body.path !== existing.path) {
    const clash = await db('design_website_pages')
      .where({ company_id: input.companyId, path: input.body.path })
      .whereNot({ id: input.id })
      .first()
    if (clash) {
      throw new HttpError(409, 'A page with this path already exists', 'WEBSITE_PAGE_PATH_TAKEN')
    }
  }
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.path != null) updates.path = input.body.path
  if (input.body.status != null) updates.status = input.body.status
  if (input.body.document != null) updates.document = JSON.stringify(input.body.document)
  if (input.body.sortOrder != null) updates.sort_order = input.body.sortOrder
  if (input.body.layoutId !== undefined) {
    const layoutId = await resolveLayoutId({
      companyId: input.companyId,
      layoutId: input.body.layoutId,
    })
    updates.layout_id = layoutId
    if (layoutId && layoutId !== existing.layout_id) {
      updates.sort_order = await nextPageSortOrder({ companyId: input.companyId, layoutId })
    }
  }
  await db('design_website_pages').where({ id: input.id }).update(updates)
  return getWebsitePage({ companyId: input.companyId, id: input.id })
}

export async function deleteWebsitePage(input: { companyId: string; id: string }): Promise<void> {
  const deleted = await db('design_website_pages')
    .where({ id: input.id, company_id: input.companyId })
    .del()
  if (!deleted) throw new HttpError(404, 'Page not found', 'WEBSITE_PAGE_NOT_FOUND')
}
