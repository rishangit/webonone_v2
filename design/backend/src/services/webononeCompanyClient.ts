import { env } from '../config/env.js'
import { HttpError } from './httpError.js'

export type WebOnOneCompany = {
  id: string
  name: string
  webSlug: string
  webUrl: string
  status: string
  logoUrl: string | null
  contactEmail: string | null
}

async function fetchWebOnOneCompany(path: string): Promise<WebOnOneCompany> {
  const apiBase = env.webononeApiBaseUrl.replace(/\/$/, '')
  const apiKey = env.webononeServiceApiKey
  if (!apiBase || !apiKey) {
    throw new HttpError(503, 'WebOnOne company lookup is not configured', 'COMPANY_LOOKUP_UNAVAILABLE')
  }

  const url = `${apiBase}${path}`
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
    webSlug: data.webSlug ?? '',
    webUrl: data.webUrl ?? '',
    status: data.status ?? 'unknown',
    logoUrl: data.logoUrl ?? null,
    contactEmail: data.contactEmail ?? null,
  }
}

/** Resolve company details from WebOnOne (HTTP contract — never shared DB). */
export async function getCompanyFromWebOnOne(companyId: string): Promise<WebOnOneCompany> {
  return fetchWebOnOneCompany(`/api/v1/internal/companies/${encodeURIComponent(companyId)}`)
}

export async function getCompanyFromWebOnOneBySlug(slug: string): Promise<WebOnOneCompany> {
  return fetchWebOnOneCompany(`/api/v1/internal/companies/by-slug/${encodeURIComponent(slug)}`)
}

/** Accept a company id (nanoid) or public web slug. */
export async function resolveCompanyFromWebOnOne(idOrSlug: string): Promise<WebOnOneCompany> {
  const value = idOrSlug.trim()
  if (value.length === 21) {
    try {
      return await getCompanyFromWebOnOne(value)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        return getCompanyFromWebOnOneBySlug(value)
      }
      throw err
    }
  }
  return getCompanyFromWebOnOneBySlug(value)
}
