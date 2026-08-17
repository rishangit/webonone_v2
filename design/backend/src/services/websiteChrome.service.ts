import { nanoid } from 'nanoid'
import { db, type DesignWebsiteChromeRow } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { emptyWebsiteDocument, websiteDocumentSchema, type WebsiteDocumentV1 } from '../schemas/websiteDocument.schema.js'
import type { CreateWebsiteChromeBody, UpdateWebsiteChromeBody } from '../schemas/websiteChrome.schema.js'

export type WebsiteChromeKind = 'headers' | 'footers'

export type WebsiteChromeDto = {
  id: string
  companyId: string
  name: string
  isDefault: boolean
  document: WebsiteDocumentV1
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function tableName(kind: WebsiteChromeKind): 'design_website_headers' | 'design_website_footers' {
  return kind === 'headers' ? 'design_website_headers' : 'design_website_footers'
}

function notFoundCode(kind: WebsiteChromeKind): string {
  return kind === 'headers' ? 'WEBSITE_HEADER_NOT_FOUND' : 'WEBSITE_FOOTER_NOT_FOUND'
}

function parseDocument(raw: DesignWebsiteChromeRow['document']): WebsiteDocumentV1 {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  const parsed = websiteDocumentSchema.safeParse(value)
  return parsed.success ? parsed.data : emptyWebsiteDocument()
}

function toBool(value: number | boolean): boolean {
  return value === true || value === 1
}

function toDto(row: DesignWebsiteChromeRow): WebsiteChromeDto {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    isDefault: toBool(row.is_default),
    document: parseDocument(row.document),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listWebsiteChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
  page?: number
  pageSize?: number
  q?: string
}): Promise<{ items: WebsiteChromeDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize
  let query = db<DesignWebsiteChromeRow>(tableName(input.kind)).where({
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
  return { items: rows.map(toDto), total, page, pageSize }
}

export async function getWebsiteChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
  id: string
}): Promise<WebsiteChromeDto> {
  const row = await db<DesignWebsiteChromeRow>(tableName(input.kind))
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!row) throw new HttpError(404, 'Not found', notFoundCode(input.kind))
  return toDto(row)
}

export async function getDefaultWebsiteChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
}): Promise<WebsiteChromeDto | null> {
  const row = await db<DesignWebsiteChromeRow>(tableName(input.kind))
    .where({ company_id: input.companyId, is_default: true })
    .first()
  return row ? toDto(row) : null
}

async function clearDefaults(kind: WebsiteChromeKind, companyId: string): Promise<void> {
  await db(tableName(kind)).where({ company_id: companyId }).update({ is_default: false })
}

export async function createWebsiteChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
  userId: string
  body: CreateWebsiteChromeBody
}): Promise<WebsiteChromeDto> {
  await getCompanyFromWebOnOne(input.companyId)
  if (input.body.isDefault) {
    await clearDefaults(input.kind, input.companyId)
  }
  const id = nanoid()
  await db(tableName(input.kind)).insert({
    id,
    company_id: input.companyId,
    name: input.body.name,
    is_default: input.body.isDefault,
    document: JSON.stringify(input.body.document),
    created_by: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  return getWebsiteChrome({ kind: input.kind, companyId: input.companyId, id })
}

export async function updateWebsiteChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
  id: string
  body: UpdateWebsiteChromeBody
}): Promise<WebsiteChromeDto> {
  const existing = await db<DesignWebsiteChromeRow>(tableName(input.kind))
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Not found', notFoundCode(input.kind))
  if (input.body.isDefault) {
    await clearDefaults(input.kind, input.companyId)
  }
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.isDefault != null) updates.is_default = input.body.isDefault
  if (input.body.document != null) updates.document = JSON.stringify(input.body.document)
  await db(tableName(input.kind)).where({ id: input.id }).update(updates)
  return getWebsiteChrome({ kind: input.kind, companyId: input.companyId, id: input.id })
}

export async function setDefaultWebsiteChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
  id: string
}): Promise<WebsiteChromeDto> {
  return updateWebsiteChrome({
    kind: input.kind,
    companyId: input.companyId,
    id: input.id,
    body: { isDefault: true },
  })
}

export async function deleteWebsiteChrome(input: {
  kind: WebsiteChromeKind
  companyId: string
  id: string
}): Promise<void> {
  const deleted = await db(tableName(input.kind))
    .where({ id: input.id, company_id: input.companyId })
    .del()
  if (!deleted) throw new HttpError(404, 'Not found', notFoundCode(input.kind))
}
