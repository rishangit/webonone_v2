import { env } from '../config/env.js'

function normalizeWebOnOneApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalUrl(path: string): string | null {
  if (!env.webononeApiBaseUrl || !env.webononeServiceApiKey) {
    console.warn(
      '[webononeNotifyClient] WEBONONE_API_BASE_URL or WEBONONE_SERVICE_API_KEY not configured',
    )
    return null
  }
  if (isPlaceholderServiceKey(env.webononeServiceApiKey)) {
    console.warn(
      '[webononeNotifyClient] WEBONONE_SERVICE_API_KEY looks like a placeholder — set the real key in payment/backend/.env',
    )
    return null
  }
  return `${normalizeWebOnOneApiBaseUrl(env.webononeApiBaseUrl)}${path}`
}

export type InvoiceIssuedNotifyPayload = {
  companyId: string
  invoiceId: string
  invoiceNumber: string
  paymentReference: string
  amountMinor: number
  currency: string
  periodStart: string
  periodEnd: string
  dueAt: string
  issuedAt: string
  billingPeriod: string
  invoicesUrl: string
}

/**
 * Best-effort notify WebOnOne to email/SMS/in-app the company owner when an invoice is issued.
 * Never throws — invoice creation must succeed even if notify fails.
 */
export function notifyInvoiceIssued(payload: InvoiceIssuedNotifyPayload): void {
  void notifyInvoiceIssuedAsync(payload).catch((err) => {
    console.error('[webononeNotifyClient] unexpected error:', err)
  })
}

async function notifyInvoiceIssuedAsync(payload: InvoiceIssuedNotifyPayload): Promise<void> {
  const url = resolveInternalUrl('/api/v1/internal/invoices/issued')
  if (!url) return

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WebOnOne-Service-Key': env.webononeServiceApiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[webononeNotifyClient] notify failed (${response.status}): ${text}`)
    }
  } catch (err) {
    console.error('[webononeNotifyClient] notify error:', err)
  }
}
