export type InvoiceStatus = 'issued' | 'paid' | 'overdue' | 'void' | 'pending_verification'

export type InvoiceListItem = {
  id: string
  invoiceNumber: string
  paymentReference: string
  companyId: string
  companyName: string
  kind: 'system_subscription'
  status: InvoiceStatus
  currency: string
  amountMinor: number
  periodStart: string
  periodEnd: string
  issuedAt: string
  dueAt: string
  paidAt: string | null
  receiptMediaId: string | null
  receiptUrl: string | null
  receiptFileName: string | null
  receiptUploadedAt: string | null
}

export type InvoiceDetail = InvoiceListItem & {
  voidedAt: string | null
  notes: string | null
  lines: Array<{
    id: string
    description: string
    quantity: number
    unitAmountMinor: number
    amountMinor: number
  }>
}

export type DashboardSummary = {
  issuedCount: number
  paidCount: number
  overdueCount: number
  voidCount: number
  pendingVerificationCount: number
  outstandingAmountMinor: number
  activeCompaniesCount: number
}

export type InvoiceListQuery = {
  page?: number
  pageSize?: number
  status?: string
  q?: string
  from?: string
  to?: string
  companyId?: string
}
