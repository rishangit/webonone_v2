import { env } from '../config/env.js'

/** Service origin only — strips trailing `/api/v1` if misconfigured in .env */
function normalizeSmsApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalSmsUrl(path: string): string | null {
  if (!env.smsApiBaseUrl || !env.smsServiceApiKey) {
    console.error('[smsClient] SMS_API_BASE_URL or SMS_SERVICE_API_KEY not configured; cannot call SMS')
    return null
  }
  if (isPlaceholderServiceKey(env.smsServiceApiKey)) {
    console.error(
      '[smsClient] SMS_SERVICE_API_KEY looks like a placeholder — set the real key in webonone-v2/backend/.env',
    )
    return null
  }
  return `${normalizeSmsApiBaseUrl(env.smsApiBaseUrl)}${path}`
}

export async function ensureWelcomeTemplate(
  companyId: string,
  companyName?: string,
): Promise<void> {
  const url = resolveInternalSmsUrl(
    `/api/v1/internal/companies/${encodeURIComponent(companyId)}/templates/ensure-welcome`,
  )
  if (!url) return

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sms-Service-Key': env.smsServiceApiKey,
      },
      body: JSON.stringify({ name: companyName }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[smsClient] ensure-welcome failed (${response.status}): ${text}`)
    }
  } catch (err) {
    console.error('[smsClient] ensure-welcome error:', err)
  }
}
