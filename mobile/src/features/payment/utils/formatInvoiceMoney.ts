import { formatDisplayDate } from '@/shared/utils/formatDisplayDate'

export function formatInvoiceDate(iso: string): string {
  return formatDisplayDate(iso)
}

export function formatInvoicePeriod(startIso: string, endIso: string): string {
  return `${formatInvoiceDate(startIso)} – ${formatInvoiceDate(endIso)}`
}
