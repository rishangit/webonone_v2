const DEFAULT_MEDIA_ORIGIN = 'http://127.0.0.1:3013'

export function getMediaOrigin(): string {
  return import.meta.env.VITE_MEDIA_ORIGIN ?? DEFAULT_MEDIA_ORIGIN
}

export function getMediaSelectorUrl(): string {
  return `${getMediaOrigin()}/selector`
}

/** Scope payment:company:{companyId} → disk payment/companies/{companyId}/ */
export function buildPaymentCompanyMediaScope(companyId: string): string {
  return `payment:company:${companyId}`
}

/** Invoice receipt slot → payment/companies/{id}/receipts/{invoiceId}/ */
export function buildInvoiceReceiptFolderPath(invoiceId: string): string {
  return `/receipts/${invoiceId}`
}

/** Accept invoice receipts as PDF or image. */
export const RECEIPT_ACCEPT = 'application/pdf,image/*'
