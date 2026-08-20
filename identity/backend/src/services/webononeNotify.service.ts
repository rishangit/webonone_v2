import { env } from '../config/env.js'

function normalizeWebOnOneApiBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function isPlaceholderServiceKey(key: string): boolean {
  return key.includes('<') || key.includes('>')
}

function resolveInternalUrl(path: string): string | null {
  if (!env.webononeApiBaseUrl || !env.webononeServiceApiKey) {
    return null
  }
  if (isPlaceholderServiceKey(env.webononeServiceApiKey)) {
    console.error(
      '[webononeNotify] WEBONONE_SERVICE_API_KEY looks like a placeholder — set the real key in identity/backend/.env',
    )
    return null
  }
  return `${normalizeWebOnOneApiBaseUrl(env.webononeApiBaseUrl)}${path}`
}

export async function notifyWebOnOneInApp(input: {
  userId: string
  companyId?: string
  type: string
  title: string
  body?: string
  href?: string
  sourceEventId: string
}): Promise<boolean> {
  const url = resolveInternalUrl('/api/v1/internal/notifications')
  if (!url) return false

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WebOnOne-Service-Key': env.webononeServiceApiKey,
      },
      body: JSON.stringify({
        userId: input.userId,
        companyId: input.companyId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        sourceService: 'identity',
        sourceEventId: input.sourceEventId,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error(`[webononeNotify] failed (${res.status}): ${text}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[webononeNotify] request failed:', err)
    return false
  }
}

export async function notifyCompanyAdminsCustomerAdded(input: {
  companyId: string
  companyName: string
  customerUserId: string
  customerDisplayName: string
  adminUserIds: string[]
}): Promise<void> {
  await Promise.all(
    input.adminUserIds.map((userId) =>
      notifyWebOnOneInApp({
        userId,
        companyId: input.companyId,
        type: 'identity.customer_added',
        title: `New customer: ${input.customerDisplayName}`,
        body: `${input.customerDisplayName} was added to ${input.companyName}.`,
        href: '/identity/users',
        sourceEventId: `identity.customer_added:${input.companyId}:${input.customerUserId}:${userId}`,
      }),
    ),
  )
}
