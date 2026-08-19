import { apiClient } from '@/shared/services/apiClient'
import type {
  CreateSaleBody,
  Sale,
  SaleItemKind,
  SaleListItem,
  SaleStatus,
} from '../types/sales.types'

export type ListSalesQuery = {
  page?: number
  pageSize?: number
  q?: string
  status?: SaleStatus | 'all'
  customerUserId?: string
  itemKind?: SaleItemKind
  from?: string
  to?: string
}

export const salesApi = {
  list(query: ListSalesQuery = {}) {
    const params = new URLSearchParams()
    if (query.page) params.set('page', String(query.page))
    if (query.pageSize) params.set('pageSize', String(query.pageSize))
    if (query.q?.trim()) params.set('q', query.q.trim())
    if (query.status && query.status !== 'all') params.set('status', query.status)
    if (query.customerUserId) params.set('customerUserId', query.customerUserId)
    if (query.itemKind) params.set('itemKind', query.itemKind)
    if (query.from) params.set('from', query.from)
    if (query.to) params.set('to', query.to)
    const qs = params.toString()
    return apiClient<{ items: SaleListItem[]; total: number; page: number; pageSize: number }>(
      `/company/me/sales${qs ? `?${qs}` : ''}`,
    )
  },

  get(id: string) {
    return apiClient<Sale>(`/company/me/sales/${encodeURIComponent(id)}`)
  },

  create(body: CreateSaleBody) {
    return apiClient<Sale>('/company/me/sales', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  void(id: string) {
    return apiClient<Sale>(`/company/me/sales/${encodeURIComponent(id)}/void`, {
      method: 'POST',
    })
  },
}
