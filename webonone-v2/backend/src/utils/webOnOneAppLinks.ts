import { env } from '../config/env.js'

const RETURN_PATH_QUERY = 'return_path'

export function getWebOnOneAppOrigin(): string {
  const raw = env.webononeAppOrigin?.trim() || 'http://127.0.0.1:3010'
  return raw.replace(/\/$/, '')
}

export function getWebsiteOrigin(): string {
  const raw = env.websiteOrigin?.trim() || 'http://127.0.0.1:3018'
  return raw.replace(/\/$/, '')
}

/** Public website page for a published company catalog item. Company id is in the path so a shared link identifies the company. */
export function publicCatalogItemUrl(companyId: string, kind: string, id: string): string {
  return `${getWebsiteOrigin()}/catalog/${encodeURIComponent(companyId)}/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`
}

export function absoluteWebOnOneUrl(relativePath: string): string {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  return `${getWebOnOneAppOrigin()}${path}`
}

/** Login URL with optional post-auth return path inside WebOnOne. */
export function webOnOneLoginUrl(returnPath?: string | null): string {
  const trimmed = returnPath?.trim()
  if (!trimmed) {
    return absoluteWebOnOneUrl('/login')
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const params = new URLSearchParams()
  params.set(RETURN_PATH_QUERY, path)
  return `${absoluteWebOnOneUrl('/login')}?${params.toString()}`
}

export function companyAdminCompanyUrl(companyId: string): string {
  return absoluteWebOnOneUrl(`/settings/companies/${companyId}`)
}

export function memberConnectedCompanyUrl(companyId: string): string {
  return absoluteWebOnOneUrl(`/settings/connected-companies/${companyId}`)
}

export function superAdminCompanyUrl(companyId: string): string {
  return absoluteWebOnOneUrl(`/companies/${companyId}`)
}

export function saleBillUrl(saleId: string): string {
  return webOnOneLoginUrl(`/sales/${saleId}`)
}

export function calendarEventUrl(eventId: string): string {
  return webOnOneLoginUrl(`/calendar/events/${eventId}`)
}

export function calendarSessionUrl(eventId: string, occurrenceDate: string): string {
  return webOnOneLoginUrl(`/calendar/events/${eventId}/sessions/${occurrenceDate}`)
}

export function paymentInvoiceUrl(invoiceId: string): string {
  return webOnOneLoginUrl(`/payment/invoices/${invoiceId}`)
}
