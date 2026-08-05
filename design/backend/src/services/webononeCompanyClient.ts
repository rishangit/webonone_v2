import { env } from '../config/env.js'
import { HttpError } from './httpError.js'

export type WebOnOneCompany = {
  id: string
  name: string
  status: string
  logoUrl: string | null
  contactEmail: string | null
}

/** Resolve company details from WebOnOne (HTTP contract — never shared DB). */
export async function getCompanyFromWebOnOne(companyId: string): Promise<WebOnOneCompany> {
  const apiBase = env.webononeApiBaseUrl.replace(/\/$/, '')
  const apiKey = env.webononeServiceApiKey
  if (!apiBase || !apiKey) {
    throw new HttpError(503, 'WebOnOne company lookup is not configured', 'COMPANY_LOOKUP_UNAVAILABLE')
  }

  const url = `${apiBase}/api/v1/internal/companies/${encodeURIComponent(companyId)}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'X-WebOnOne-Service-Key': apiKey,
        Accept: 'application/json',
      },
    })
  } catch {
    throw new HttpError(503, 'Unable to reach WebOnOne for company details', 'COMPANY_LOOKUP_FAILED')
  }

  if (res.status === 404) {
    throw new HttpError(404, 'Company not found', 'COMPANY_NOT_FOUND')
  }
  if (!res.ok) {
    throw new HttpError(503, 'Unable to load company details from WebOnOne', 'COMPANY_LOOKUP_FAILED')
  }

  const data = (await res.json()) as Partial<WebOnOneCompany>
  if (!data.id || !data.name) {
    throw new HttpError(503, 'Invalid company payload from WebOnOne', 'COMPANY_LOOKUP_FAILED')
  }

  return {
    id: data.id,
    name: data.name,
    status: data.status ?? 'unknown',
    logoUrl: data.logoUrl ?? null,
    contactEmail: data.contactEmail ?? null,
  }
}
