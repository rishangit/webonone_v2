import { apiClient } from '@/shared/services/apiClient'
import type {
  DashboardSummary,
  InvoiceDetail,
  InvoiceListItem,
  InvoiceListQuery,
} from '@/shared/types/payment.types'

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    sp.set(key, String(value))
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}

export const paymentApi = {
  getDashboardSummary: () =>
    apiClient<{ summary: DashboardSummary }>('/dashboard/summary').then((r) => r.summary),

  getInvoices: (query: InvoiceListQuery) =>
    apiClient<{
      items: InvoiceListItem[]
      total: number
      page: number
      pageSize: number
    }>(
      `/invoices${toQuery({
        page: query.page,
        pageSize: query.pageSize,
        status: query.status,
        q: query.q,
        from: query.from,
        to: query.to,
        companyId: query.companyId,
      })}`,
    ),

  getInvoice: (id: string) =>
    apiClient<{ invoice: InvoiceDetail }>(`/invoices/${id}`).then((r) => r.invoice),

  markPaid: (id: string, paidAt?: string | null) =>
    apiClient<{ invoice: InvoiceDetail }>(`/invoices/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ paidAt: paidAt ?? null }),
    }).then((r) => r.invoice),

  voidInvoice: (id: string, reason?: string) =>
    apiClient<{ invoice: InvoiceDetail }>(`/invoices/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }).then((r) => r.invoice),

  submitPaymentProof: (
    id: string,
    body: { mediaId: string; url: string; fileName?: string | null },
  ) =>
    apiClient<{ invoice: InvoiceDetail }>(`/invoices/${id}/submit-payment-proof`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => r.invoice),

  rejectPaymentProof: (id: string) =>
    apiClient<{ invoice: InvoiceDetail }>(`/invoices/${id}/reject-payment-proof`, {
      method: 'POST',
      body: JSON.stringify({}),
    }).then((r) => r.invoice),
}
