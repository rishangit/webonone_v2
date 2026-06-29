import { env } from '../config/env.js'

type SendEmailParams = {
  templateSlug: string
  toEmail: string
  payload: Record<string, string>
  requestedByService: 'identity' | 'webonone'
  companyId?: string
}

export async function sendTransactionalEmail(params: SendEmailParams): Promise<void> {
  if (!env.emailApiBaseUrl || !env.emailServiceApiKey) {
    console.warn('[emailClient] EMAIL_API_BASE_URL or EMAIL_SERVICE_API_KEY not configured; skipping send')
    return
  }

  const baseUrl = env.emailApiBaseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/api/v1/internal/send`

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

export async function syncUserRole(params: {
  userId: string
  role: string
  companyId?: string
  email?: string
  displayName?: string
}): Promise<void> {
  if (!env.emailApiBaseUrl || !env.emailServiceApiKey) {
    console.warn('[emailClient] EMAIL_API_BASE_URL or EMAIL_SERVICE_API_KEY not configured; skipping role sync')
    return
  }

  const baseUrl = env.emailApiBaseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/api/v1/internal/sync-user-role`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Email-Service-Key': env.emailServiceApiKey,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[emailClient] sync-user-role failed (${response.status}): ${text}`)
    }
  } catch (err) {
    console.error('[emailClient] sync-user-role error:', err)
  }
}
