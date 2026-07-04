import { env } from '../config/env.js'

/** Service origin only — strips trailing `/api/v1` if misconfigured in .env */
function normalizeEmailApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalEmailUrl(path: string): string | null {
  if (!env.emailApiBaseUrl || !env.emailServiceApiKey) {
    console.error('[emailClient] EMAIL_API_BASE_URL or EMAIL_SERVICE_API_KEY not configured; cannot send email')
    return null
  }
  if (isPlaceholderServiceKey(env.emailServiceApiKey)) {
    console.error(
      '[emailClient] EMAIL_SERVICE_API_KEY looks like a placeholder — set the real key in webonone-v2/backend/.env',
    )
    return null
  }
  return `${normalizeEmailApiBaseUrl(env.emailApiBaseUrl)}${path}`
}

type SendEmailParams = {
  templateSlug: string
  toEmail: string
  payload: Record<string, string>
  requestedByService: 'identity' | 'webonone'
  companyId?: string
}

export async function sendTransactionalEmail(params: SendEmailParams): Promise<void> {
  const url = resolveInternalEmailUrl('/api/v1/internal/send')
  if (!url) return

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Email-Service-Key': env.emailServiceApiKey,
      },
      body: JSON.stringify({
        templateSlug: params.templateSlug,
        toEmail: params.toEmail,
        payload: params.payload,
        companyId: params.companyId,
        requestedByService: params.requestedByService,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[emailClient] send failed (${response.status}): ${text}`)
    }
  } catch (err) {
    console.error('[emailClient] send error:', err)
  }
}
