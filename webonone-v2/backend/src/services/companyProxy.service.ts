import { env } from '../config/env.js'

type CompanyProxyOptions = {
  method?: string
  body?: unknown
  identityToken?: string
  superAdminToken?: string
}

export async function companyProxy<T>(path: string, options: CompanyProxyOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.superAdminToken) {
    headers.Authorization = `Bearer ${options.superAdminToken}`
  } else if (options.identityToken) {
    headers.Authorization = `Bearer ${options.identityToken}`
  }

  const res = await fetch(`${env.companyApiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error((data as { message?: string }).message ?? 'Company API request failed')
    ;(err as Error & { statusCode: number }).statusCode = res.status
    throw err
  }

  return data as T
}
