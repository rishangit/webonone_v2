import { nanoid } from 'nanoid'
import { db, type DesignWebsitePresetRow } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { emptyWebsiteDocument, websiteDocumentSchema, type WebsiteDocumentV1 } from '../schemas/websiteDocument.schema.js'
import type { CreateWebsitePresetBody, UpdateWebsitePresetBody } from '../schemas/websitePresets.schema.js'

export type WebsitePresetDto = {
  id: string
  companyId: string
  name: string
  document: WebsiteDocumentV1
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function parseDocument(raw: DesignWebsitePresetRow['document']): WebsiteDocumentV1 {
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  const parsed = websiteDocumentSchema.safeParse(value)
  return parsed.success ? parsed.data : emptyWebsiteDocument()
}

function toDto(row: DesignWebsitePresetRow): WebsitePresetDto {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    document: parseDocument(row.document),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listWebsitePresets(input: {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
}): Promise<{ items: WebsitePresetDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize
  let query = db<DesignWebsitePresetRow>('design_website_presets').where({
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
  const rows = await query.clone().orderBy('updated_at', 'desc').limit(pageSize).offset(offset)
  return { items: rows.map(toDto), total, page, pageSize }
}

export async function getWebsitePreset(input: { companyId: string; id: string }): Promise<WebsitePresetDto> {
  const row = await db<DesignWebsitePresetRow>('design_website_presets')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!row) throw new HttpError(404, 'Not found', 'WEBSITE_PRESET_NOT_FOUND')
  return toDto(row)
}

export async function createWebsitePreset(input: {
  companyId: string
  userId: string
  body: CreateWebsitePresetBody
}): Promise<WebsitePresetDto> {
  await getCompanyFromWebOnOne(input.companyId)
  const id = nanoid()
  await db('design_website_presets').insert({
    id,
    company_id: input.companyId,
    name: input.body.name,
    document: JSON.stringify(input.body.document),
    created_by: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  return getWebsitePreset({ companyId: input.companyId, id })
}

export async function updateWebsitePreset(input: {
  companyId: string
  id: string
  body: UpdateWebsitePresetBody
}): Promise<WebsitePresetDto> {
  const existing = await db<DesignWebsitePresetRow>('design_website_presets')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Not found', 'WEBSITE_PRESET_NOT_FOUND')
  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.document != null) updates.document = JSON.stringify(input.body.document)
  await db('design_website_presets').where({ id: input.id }).update(updates)
  return getWebsitePreset({ companyId: input.companyId, id: input.id })
}

export async function deleteWebsitePreset(input: { companyId: string; id: string }): Promise<void> {
  const existing = await db<DesignWebsitePresetRow>('design_website_presets')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Not found', 'WEBSITE_PRESET_NOT_FOUND')
  await db('design_website_presets').where({ id: input.id, company_id: input.companyId }).del()
}
