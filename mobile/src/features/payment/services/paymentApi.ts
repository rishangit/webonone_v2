import { env } from '@/shared/config/env'
import { createApiClient } from '@/shared/services/apiClient'
import type {
  InvoiceDetail,
  InvoiceListItem,
  InvoiceListQuery,
} from '@/features/payment/types/payment.types'

const client = createApiClient(env.paymentApiBaseUrl)

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
  getInvoices: (query: InvoiceListQuery) =>
    client<{
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
    client<{ invoice: InvoiceDetail }>(`/invoices/${id}`).then((r) => r.invoice),

  markPaid: (id: string, paidAt?: string | null) =>
    client<{ invoice: InvoiceDetail }>(`/invoices/${id}/mark-paid`, {
      method: 'POST',
      body: { paidAt: paidAt ?? null },
    }).then((r) => r.invoice),

  voidInvoice: (id: string, reason?: string) =>
    client<{ invoice: InvoiceDetail }>(`/invoices/${id}/void`, {
      method: 'POST',
      body: { reason },
    }).then((r) => r.invoice),

  submitPaymentProof: (
    id: string,
    body: { mediaId: string; url: string; fileName?: string | null },
  ) =>
    client<{ invoice: InvoiceDetail }>(`/invoices/${id}/submit-payment-proof`, {
      method: 'POST',
      body,
    }).then((r) => r.invoice),

  rejectPaymentProof: (id: string) =>
    client<{ invoice: InvoiceDetail }>(`/invoices/${id}/reject-payment-proof`, {
      method: 'POST',
      body: {},
    }).then((r) => r.invoice),
}
