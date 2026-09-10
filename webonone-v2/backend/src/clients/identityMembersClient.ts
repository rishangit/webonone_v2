import { env } from '../config/env.js'

export type CompanyMemberDto = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
  role: 'company_admin' | 'member'
}

function apiBase(): string {
  if (!env.identityApiBaseUrl) {
    throw new Error('IDENTITY_API_BASE_URL not configured')
  }
  return env.identityApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')
}

function serviceHeaders(): Record<string, string> {
  if (!env.identityServiceApiKey) {
    throw new Error('IDENTITY_SERVICE_API_KEY not configured')
  }
  return {
    Accept: 'application/json',
    'X-Identity-Service-Key': env.identityServiceApiKey,
  }
}

/** Soft-degrade: returns [] when Identity is unreachable. */
export async function listCompanyMembers(companyId: string): Promise<CompanyMemberDto[]> {
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/internal/companies/${encodeURIComponent(companyId)}/members`,
      { headers: serviceHeaders() },
    )
    if (!res.ok) {
      console.warn(`[identityMembers] list failed (${res.status})`)
      return []
    }
    const data = (await res.json()) as { items?: CompanyMemberDto[] }
    return Array.isArray(data.items) ? data.items : []
  } catch (err) {
    console.warn('[identityMembers] list error:', err)
    return []
  }
}
