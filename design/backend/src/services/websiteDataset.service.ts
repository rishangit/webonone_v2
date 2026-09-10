import { nanoid } from 'nanoid'
import { db, type DesignWebsiteDatasetRow } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { queryCompanyDataset } from './webononeDatasetClient.js'
import {
  assertFiltersMatchSource,
  datasetConfigSchema,
  datasetFiltersSchema,
  getDatasetFieldCatalogPayload,
  pickPublicFields,
  type DatasetConfig,
  type DatasetFilters,
  type DatasetSourceType,
} from '../schemas/websiteDatasetFilters.schema.js'
import type {
  CreateWebsiteDatasetBody,
  UpdateWebsiteDatasetBody,
} from '../schemas/websiteDatasets.schema.js'

export type WebsiteDatasetDto = {
  id: string
  companyId: string
  name: string
  sourceType: DatasetSourceType
  filters: DatasetFilters
  config: DatasetConfig
  status: 'active' | 'inactive'
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function parseJson<T>(raw: string | T | null | undefined, fallback: T): T {
  if (raw == null) return fallback
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }
  return raw
}

function toDto(row: DesignWebsiteDatasetRow): WebsiteDatasetDto {
  const filtersParsed = datasetFiltersSchema.safeParse(
    parseJson(row.filters, { match: 'all', rules: [] }),
  )
  const configParsed = datasetConfigSchema.safeParse(parseJson(row.config, {}))
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    sourceType: row.source_type,
    filters: filtersParsed.success ? filtersParsed.data : { match: 'all', rules: [] },
    config: configParsed.success ? configParsed.data : {},
    status: row.status,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export function getWebsiteDatasetFieldCatalog() {
  return getDatasetFieldCatalogPayload()
}

export async function listWebsiteDatasets(input: {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
}): Promise<{ items: WebsiteDatasetDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))
  const offset = (page - 1) * pageSize
  let query = db<DesignWebsiteDatasetRow>('design_website_datasets').where({
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

export async function getWebsiteDataset(input: {
  companyId: string
  id: string
}): Promise<WebsiteDatasetDto> {
  const row = await db<DesignWebsiteDatasetRow>('design_website_datasets')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!row) throw new HttpError(404, 'Not found', 'WEBSITE_DATASET_NOT_FOUND')
  return toDto(row)
}

export async function createWebsiteDataset(input: {
  companyId: string
  userId: string
  body: CreateWebsiteDatasetBody
}): Promise<WebsiteDatasetDto> {
  await getCompanyFromWebOnOne(input.companyId)
  assertFiltersMatchSource(input.body.sourceType, input.body.filters, input.body.config)
  const id = nanoid()
  await db('design_website_datasets').insert({
    id,
    company_id: input.companyId,
    name: input.body.name,
    source_type: input.body.sourceType,
    filters: JSON.stringify(input.body.filters),
    config: JSON.stringify(input.body.config ?? {}),
    status: input.body.status ?? 'active',
    created_by: input.userId,
    created_at: db.fn.now(3),
    updated_at: db.fn.now(3),
  })
  return getWebsiteDataset({ companyId: input.companyId, id })
}

export async function updateWebsiteDataset(input: {
  companyId: string
  id: string
  body: UpdateWebsiteDatasetBody
}): Promise<WebsiteDatasetDto> {
  const existing = await getWebsiteDataset({ companyId: input.companyId, id: input.id })
  const nextSource = input.body.sourceType ?? existing.sourceType
  const nextFilters = input.body.filters ?? existing.filters
  const nextConfig = input.body.config ?? existing.config
  assertFiltersMatchSource(nextSource, nextFilters, nextConfig)

  const updates: Record<string, unknown> = { updated_at: db.fn.now(3) }
  if (input.body.name != null) updates.name = input.body.name
  if (input.body.sourceType != null) updates.source_type = input.body.sourceType
  if (input.body.filters != null) updates.filters = JSON.stringify(input.body.filters)
  if (input.body.config != null) updates.config = JSON.stringify(input.body.config)
  if (input.body.status != null) updates.status = input.body.status

  await db('design_website_datasets').where({ id: input.id, company_id: input.companyId }).update(updates)
  return getWebsiteDataset({ companyId: input.companyId, id: input.id })
}

export async function deleteWebsiteDataset(input: { companyId: string; id: string }): Promise<void> {
  const existing = await db<DesignWebsiteDatasetRow>('design_website_datasets')
    .where({ id: input.id, company_id: input.companyId })
    .first()
  if (!existing) throw new HttpError(404, 'Not found', 'WEBSITE_DATASET_NOT_FOUND')
  await db('design_website_datasets').where({ id: input.id, company_id: input.companyId }).del()
}

export async function previewWebsiteDataset(input: {
  companyId: string
  id: string
  page?: number
  pageSize?: number
}): Promise<{
  items: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  sourceType: DatasetSourceType
  datasetId: string
  datasetName: string
}> {
  const dataset = await getWebsiteDataset({ companyId: input.companyId, id: input.id })
  const result = await queryCompanyDataset({
    companyId: input.companyId,
    sourceType: dataset.sourceType,
    filters: dataset.filters,
    config: dataset.config,
    page: input.page,
    pageSize: input.pageSize,
  })
  return {
    ...result,
    sourceType: dataset.sourceType,
    datasetId: dataset.id,
    datasetName: dataset.name,
  }
}

export async function getPublicWebsiteDatasetData(input: {
  companyId: string
  datasetId: string
  page?: number
  pageSize?: number
}): Promise<{
  items: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  sourceType: DatasetSourceType
  datasetId: string
  datasetName: string
}> {
  const row = await db<DesignWebsiteDatasetRow>('design_website_datasets')
    .where({ id: input.datasetId, company_id: input.companyId, status: 'active' })
    .first()
  if (!row) throw new HttpError(404, 'Not found', 'WEBSITE_DATASET_NOT_FOUND')
  const dataset = toDto(row)
  const result = await queryCompanyDataset({
    companyId: input.companyId,
    sourceType: dataset.sourceType,
    filters: dataset.filters,
    config: dataset.config,
    page: input.page,
    pageSize: input.pageSize,
  })
  return {
    items: result.items.map((item) => pickPublicFields(dataset.sourceType, item)),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    sourceType: dataset.sourceType,
    datasetId: dataset.id,
    datasetName: dataset.name,
  }
}
