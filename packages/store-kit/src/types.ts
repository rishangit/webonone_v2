export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type CatalogListQuery = {
  page?: number
  pageSize?: number
  q?: string
  status?: string
  force?: boolean
  extra?: Record<string, string>
}

export type PaginatedListQuery = {
  page?: number
  pageSize?: number
  status?: string
  force?: boolean
  extra?: Record<string, string | undefined>
}

export interface PaginatedFeatureState<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  status: string
  queryKey: string
  lastFetchedAt: number | null
  listStatus: 'idle' | 'loading' | 'error'
  listError: string | null
}

export interface CatalogFeatureState<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  q: string
  status: string
  queryKey: string
  lastFetchedAt: number | null
  listStatus: 'idle' | 'loading' | 'error'
  listError: string | null
  detail: T | null
  detailId: string | null
  detailLastFetchedAt: number | null
  detailStatus: 'idle' | 'loading' | 'saving' | 'error'
  detailError: string | null
}
