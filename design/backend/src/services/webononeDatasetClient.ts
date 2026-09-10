import { env } from '../config/env.js'
import { HttpError } from './httpError.js'
import type {
  DatasetConfig,
  DatasetFilters,
  DatasetSourceType,
} from '../schemas/websiteDatasetFilters.schema.js'

export type DatasetQueryResult = {
  items: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
}

export async function queryCompanyDataset(input: {
  companyId: string
  sourceType: DatasetSourceType
  filters: DatasetFilters
  config?: DatasetConfig | null
  page?: number
  pageSize?: number
}): Promise<DatasetQueryResult> {
  const apiBase = env.webononeApiBaseUrl.replace(/\/$/, '')
  const apiKey = env.webononeServiceApiKey
  if (!apiBase || !apiKey) {
    throw new HttpError(503, 'WebOnOne dataset query is not configured', 'DATASET_QUERY_UNAVAILABLE')
  }

  let res: Response
  try {
    res = await fetch(
      `${apiBase}/api/v1/internal/companies/${encodeURIComponent(input.companyId)}/dataset-query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-WebOnOne-Service-Key': apiKey,
        },
        body: JSON.stringify({
          sourceType: input.sourceType,
          filters: input.filters,
          config: input.config ?? {},
          page: input.page ?? 1,
          pageSize: input.pageSize ?? 20,
        }),
      },
    )
  } catch {
    throw new HttpError(503, 'Unable to reach WebOnOne for dataset query', 'DATASET_QUERY_FAILED')
  }

  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null
    throw new HttpError(400, body?.message ?? 'Invalid dataset query', 'DATASET_QUERY_INVALID')
  }
  if (res.status === 404) {
    throw new HttpError(404, 'Company not found', 'COMPANY_NOT_FOUND')
  }
  if (!res.ok) {
    throw new HttpError(503, 'Unable to run dataset query on WebOnOne', 'DATASET_QUERY_FAILED')
  }

  const data = (await res.json()) as Partial<DatasetQueryResult>
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total ?? 0),
    page: Number(data.page ?? input.page ?? 1),
    pageSize: Number(data.pageSize ?? input.pageSize ?? 20),
  }
}
