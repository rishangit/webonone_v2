import { listLibraryItemsByIds } from '../clients/dataCatalogClient.js'
import { listCompanyMembers } from '../clients/identityMembersClient.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import type { CatalogEntityKind } from '../schemas/companyCatalogSchemas.js'
import {
  type AnalyticsDimension,
  type DatasetConfig,
  type DatasetFilters,
  type DatasetQueryBody,
  type DatasetSourceType,
  assertFiltersMatchSource,
} from '../schemas/datasetQuery.schema.js'
import * as analyticsService from './companyAnalytics.service.js'
import * as staffService from './companyStaff.service.js'
import { applyDatasetFilters, paginateRows } from '../utils/datasetFilterEngine.js'

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function payloadStatus(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const status = (payload as { status?: unknown }).status
  return typeof status === 'string' ? status : null
}

function payloadString(payload: unknown, key: string): string | null {
  if (!payload || typeof payload !== 'object') return null
  const value = (payload as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

function payloadNumber(payload: unknown, key: string): number | null {
  if (!payload || typeof payload !== 'object') return null
  const value = (payload as Record<string, unknown>)[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

async function loadCatalogRows(
  companyId: string,
  kind: 'products' | 'services' | 'spaces',
): Promise<Record<string, unknown>[]> {
  const rows = await catalogRepo.listByCompanyAndKind(companyId, kind as CatalogEntityKind)
  const dtos = rows.map((row) => catalogRepo.mapCatalogRow(kind, row as unknown as Record<string, unknown>))

  const linkedIds = dtos
    .filter((d) => d.bindingMode === 'linked' && d.libraryEntityId)
    .map((d) => d.libraryEntityId as string)
  const libraryItems = await listLibraryItemsByIds(kind, linkedIds)
  const libraryById = new Map(libraryItems.map((item) => [item.id, item]))

  return dtos.map((dto) => {
    const library = dto.libraryEntityId ? libraryById.get(dto.libraryEntityId) : undefined
    const payload = dto.payload
    const name =
      dto.name ??
      payloadString(payload, 'name') ??
      library?.name ??
      null
    const description =
      dto.description ??
      payloadString(payload, 'description') ??
      library?.description ??
      null
    const status =
      payloadStatus(payload) ??
      (typeof library?.status === 'string' ? library.status : null)
    const listPrice =
      ('listPrice' in dto ? (dto.listPrice as number | null) : null) ??
      payloadNumber(payload, 'listPrice')

    const base: Record<string, unknown> = {
      id: dto.id,
      name,
      description,
      status,
      listPrice,
      galleryImages:
        ('galleryImages' in dto ? dto.galleryImages : null) ?? library?.galleryImages ?? null,
    }

    if (kind === 'services') {
      base.timeMode =
        payloadString(payload, 'timeMode') ??
        library?.timeMode ??
        null
      base.durationMinutes =
        payloadNumber(payload, 'durationMinutes') ??
        library?.durationMinutes ??
        null
      base.startTime = payloadString(payload, 'startTime') ?? library?.startTime ?? null
      base.endTime = payloadString(payload, 'endTime') ?? library?.endTime ?? null
    }

    return base
  })
}

async function loadStaffRows(companyId: string): Promise<Record<string, unknown>[]> {
  const result = await staffService.listCompanyStaff(companyId)
  return result.items.map((item) => ({
    id: item.id,
    displayName: item.displayName,
    email: item.email,
    avatarUrl: item.avatarUrl,
    schedule: item.schedule,
  }))
}

async function loadUserRows(companyId: string): Promise<Record<string, unknown>[]> {
  const members = await listCompanyMembers(companyId)
  return members.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    email: m.email,
    avatarUrl: m.avatarUrl,
    role: m.role,
  }))
}

function analyticsRows(
  data: Awaited<ReturnType<typeof analyticsService.getCompanyAnalytics>>,
  dimension: AnalyticsDimension,
): Record<string, unknown>[] {
  switch (dimension) {
    case 'kpis':
      return [{ ...data.kpis }]
    case 'revenue_over_time':
      return data.revenueOverTime.map((row) => ({ ...row }))
    case 'top_products':
      return data.topItems.product.map((row) => ({ ...row }))
    case 'top_services':
      return data.topItems.service.map((row) => ({ ...row }))
    case 'top_spaces':
      return data.topItems.space.map((row) => ({ ...row }))
    case 'top_customers':
      return data.topCustomers.map((row) => ({ ...row }))
    case 'sales_by_staff':
      return data.salesByStaff.map((row) => ({ ...row }))
    case 'event_run_status':
      return data.eventRunStatus.map((row) => ({ ...row }))
    case 'token_status':
      return data.tokenStatus.map((row) => ({ ...row }))
    default:
      return []
  }
}

async function loadSourceRows(
  companyId: string,
  sourceType: DatasetSourceType,
  config: DatasetConfig,
): Promise<Record<string, unknown>[]> {
  switch (sourceType) {
    case 'products':
    case 'services':
    case 'spaces':
      return loadCatalogRows(companyId, sourceType)
    case 'staff':
      return loadStaffRows(companyId)
    case 'users':
      return loadUserRows(companyId)
    case 'analytics': {
      const range = config.dateRange ?? defaultDateRange()
      const dimension = config.dimension ?? 'kpis'
      const data = await analyticsService.getCompanyAnalytics(companyId, range.from, range.to)
      return analyticsRows(data, dimension)
    }
    default:
      return []
  }
}

export async function executeDatasetQuery(
  companyId: string,
  input: DatasetQueryBody,
): Promise<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
  try {
    assertFiltersMatchSource(input.sourceType, input.filters as DatasetFilters, input.config)
  } catch (err) {
    throw httpError(err instanceof Error ? err.message : 'Invalid filters', 400)
  }

  const rows = await loadSourceRows(companyId, input.sourceType, input.config)
  const filtered = applyDatasetFilters(rows, input.filters)
  return paginateRows(filtered, input.page, input.pageSize)
}
