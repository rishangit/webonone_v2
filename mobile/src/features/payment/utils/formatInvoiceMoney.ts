const DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

export function formatLkr(amountMinor: number): string {
  const major = amountMinor / 100
  return `Rs ${major.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatInvoiceDate(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en', DISPLAY_DATE_OPTIONS)
}

export function formatInvoicePeriod(startIso: string, endIso: string): string {
  return `${formatInvoiceDate(startIso)} – ${formatInvoiceDate(endIso)}`
}
