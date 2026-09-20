import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type {
  CreateSaleBody,
  Sale,
  SaleItemKind,
  SaleListItem,
  SaleStatus,
} from '@/features/sales/types/sales.types'

const client = createApiClient(env.webononeApiBaseUrl)

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    sp.set(key, String(value))
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}

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
    return client<{ items: SaleListItem[]; total: number; page: number; pageSize: number }>(
      `/company/me/sales${toQuery({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q,
        status: query.status && query.status !== 'all' ? query.status : undefined,
        customerUserId: query.customerUserId,
        itemKind: query.itemKind,
        from: query.from,
        to: query.to,
      })}`,
    )
  },

  get(id: string) {
    return client<Sale>(`/company/me/sales/${encodeURIComponent(id)}`)
  },

  create(body: CreateSaleBody) {
    return client<Sale>('/company/me/sales', {
      method: 'POST',
      body,
    })
  },

  void(id: string) {
    return client<Sale>(`/company/me/sales/${encodeURIComponent(id)}/void`, {
      method: 'POST',
    })
  },
}
