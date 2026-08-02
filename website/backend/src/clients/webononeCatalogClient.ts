import { env } from '../config/env.js'



export type CatalogKind = 'products' | 'services' | 'spaces'



export type CatalogSearchItem = {

  id: string

  kind: CatalogKind

  name: string

  description: string | null

  companyId: string

  companyName: string

  tags: Array<{ id: string; name: string; color?: string }>

  imageUrl: string | null

  distanceKm: number | null

  latitude: number | null

  longitude: number | null

}



export type CatalogDetailItem = CatalogSearchItem & {

  galleryImages: Array<{ mediaId: string; url: string }>

  timeMode?: 'duration' | 'window' | null

  durationMinutes?: number | null

  startTime?: string | null

  endTime?: string | null

}



export type CatalogSearchResult = {

  items: CatalogSearchItem[]

  total: number

  page: number

  pageSize: number

}



export type CatalogSessionItem = {

  eventId: string

  occurrenceDate: string

  startTime: string

  endTime: string

  serviceName: string

  companyId: string

}



export type SessionTokenItem = {

  id: string

  companyId: string

  eventId: string

  occurrenceDate: string

  tokenNumber: number

  tokenLabel: string

  userId: string

  userDisplayName: string

  userEmail: string | null

  createdAt: string

  updatedAt: string

}



function apiBase(): string {

  if (!env.webononeApiBaseUrl) {

    throw new Error('WEBONONE_API_BASE_URL not configured')

  }

  return env.webononeApiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/i, '')

}



function requireServiceKey(): string {

  if (!env.webononeServiceApiKey) {

    throw Object.assign(new Error('WebOnOne service key is not configured'), { statusCode: 503 })

  }

  return env.webononeServiceApiKey

}



async function parseErrorMessage(res: Response, fallback: string): Promise<string> {

  const text = await res.text()

  let message = text || fallback

  try {

    const body = JSON.parse(text) as { message?: string }

    if (body.message) message = body.message

  } catch {

    // keep raw text

  }

  return message

}



function mapUpstreamStatus(status: number): number {

  if (status === 404) return 404

  if (status === 401) return 401

  if (status === 409) return 409

  if (status === 400) return 400

  if (status >= 500) return 502

  return status

}



/** Proxy marketplace search to WebOnOne internal catalog API. */

export async function searchCatalog(query: {

  q?: string

  page?: string | number

  pageSize?: string | number

  lat?: string | number

  lng?: string | number

}): Promise<CatalogSearchResult> {

  const params = new URLSearchParams()

  if (typeof query.q === 'string' && query.q.trim()) {

    params.set('q', query.q.trim())

  }

  if (query.page != null) params.set('page', String(query.page))

  if (query.pageSize != null) params.set('pageSize', String(query.pageSize))

  if (query.lat != null && query.lat !== '') params.set('lat', String(query.lat))

  if (query.lng != null && query.lng !== '') params.set('lng', String(query.lng))



  const url = `${apiBase()}/api/v1/internal/catalog/search?${params.toString()}`

  const res = await fetch(url, {

    headers: {

      'X-WebOnOne-Service-Key': requireServiceKey(),

      'Content-Type': 'application/json',

    },

  })



  if (!res.ok) {

    const message = await parseErrorMessage(res, `WebOnOne catalog search failed (${res.status})`)

    throw Object.assign(new Error(message), { statusCode: mapUpstreamStatus(res.status) })

  }



  return (await res.json()) as CatalogSearchResult

}



/** Proxy marketplace detail to WebOnOne internal catalog API. */

export async function getCatalogItem(

  kind: string,

  id: string,

  query: { lat?: string | number; lng?: string | number } = {},

): Promise<CatalogDetailItem> {

  const params = new URLSearchParams()

  if (query.lat != null && query.lat !== '') params.set('lat', String(query.lat))

  if (query.lng != null && query.lng !== '') params.set('lng', String(query.lng))



  const qs = params.toString()

  const url = `${apiBase()}/api/v1/internal/catalog/${encodeURIComponent(kind)}/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {

    headers: {

      'X-WebOnOne-Service-Key': requireServiceKey(),

      'Content-Type': 'application/json',

    },

  })



  if (!res.ok) {

    const message = await parseErrorMessage(res, `WebOnOne catalog detail failed (${res.status})`)

    throw Object.assign(new Error(message), { statusCode: mapUpstreamStatus(res.status) })

  }



  return (await res.json()) as CatalogDetailItem

}



/** Proxy Specific-time sessions for a marketplace service. */

export async function listServiceSessions(

  serviceId: string,

  query: { from?: string; to?: string } = {},

): Promise<{ items: CatalogSessionItem[] }> {

  const params = new URLSearchParams()

  if (query.from) params.set('from', query.from)

  if (query.to) params.set('to', query.to)

  const qs = params.toString()

  const url = `${apiBase()}/api/v1/internal/catalog/services/${encodeURIComponent(serviceId)}/sessions${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {

    headers: {

      'X-WebOnOne-Service-Key': requireServiceKey(),

      'Content-Type': 'application/json',

    },

  })



  if (!res.ok) {

    const message = await parseErrorMessage(res, `WebOnOne sessions failed (${res.status})`)

    throw Object.assign(new Error(message), { statusCode: mapUpstreamStatus(res.status) })

  }



  return (await res.json()) as { items: CatalogSessionItem[] }

}



function requireBearer(accessToken: string): string {

  const token = accessToken.trim()

  if (!token) {

    throw Object.assign(new Error('Missing authorization'), { statusCode: 401 })

  }

  return token.startsWith('Bearer ') ? token : `Bearer ${token}`

}



/** Forward user JWT to WebOnOne public next-token endpoint. */

export async function getNextSessionToken(

  serviceId: string,

  eventId: string,

  occurrenceDate: string,

  accessToken: string,

): Promise<{ tokenNumber: number; tokenLabel: string }> {

  const url = `${apiBase()}/api/v1/public/catalog/services/${encodeURIComponent(serviceId)}/sessions/${encodeURIComponent(eventId)}/${encodeURIComponent(occurrenceDate)}/tokens/next`

  const res = await fetch(url, {

    headers: {

      Authorization: requireBearer(accessToken),

      'Content-Type': 'application/json',

    },

  })



  if (!res.ok) {

    const message = await parseErrorMessage(res, `Next token failed (${res.status})`)

    throw Object.assign(new Error(message), { statusCode: mapUpstreamStatus(res.status) })

  }



  return (await res.json()) as { tokenNumber: number; tokenLabel: string }

}



/** Forward user JWT to WebOnOne public my-token endpoint. */

export async function getMySessionToken(

  serviceId: string,

  eventId: string,

  occurrenceDate: string,

  accessToken: string,

): Promise<SessionTokenItem | null> {

  const url = `${apiBase()}/api/v1/public/catalog/services/${encodeURIComponent(serviceId)}/sessions/${encodeURIComponent(eventId)}/${encodeURIComponent(occurrenceDate)}/tokens/mine`

  const res = await fetch(url, {

    headers: {

      Authorization: requireBearer(accessToken),

      'Content-Type': 'application/json',

    },

  })



  if (res.status === 404) return null

  if (!res.ok) {

    const message = await parseErrorMessage(res, `My token failed (${res.status})`)

    throw Object.assign(new Error(message), { statusCode: mapUpstreamStatus(res.status) })

  }



  return (await res.json()) as SessionTokenItem

}



/** Forward user JWT to WebOnOne public book-token endpoint. */

export async function bookSessionToken(

  serviceId: string,

  eventId: string,

  occurrenceDate: string,

  accessToken: string,

  body: { user_display_name: string; user_email?: string | null },

): Promise<SessionTokenItem> {

  const url = `${apiBase()}/api/v1/public/catalog/services/${encodeURIComponent(serviceId)}/sessions/${encodeURIComponent(eventId)}/${encodeURIComponent(occurrenceDate)}/tokens`

  const res = await fetch(url, {

    method: 'POST',

    headers: {

      Authorization: requireBearer(accessToken),

      'Content-Type': 'application/json',

    },

    body: JSON.stringify(body),

  })



  if (!res.ok) {

    const message = await parseErrorMessage(res, `Book token failed (${res.status})`)

    throw Object.assign(new Error(message), { statusCode: mapUpstreamStatus(res.status) })

  }



  return (await res.json()) as SessionTokenItem

}


