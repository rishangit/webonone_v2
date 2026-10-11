import { env } from '../config/env.js'

const RETURN_PATH_QUERY = 'return_path'

export function getWebOnOneAppOrigin(): string {
  return env.webononeFrontendOrigin.replace(/\/$/, '')
}

export function absoluteWebOnOneUrl(relativePath: string): string {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  return `${getWebOnOneAppOrigin()}${path}`
}

export function webOnOneLoginUrl(returnPath?: string | null): string {
  const trimmed = returnPath?.trim()
  if (!trimmed) {
    return absoluteWebOnOneUrl('/login')
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const params = new URLSearchParams()
  params.set(RETURN_PATH_QUERY, path)
  return `${absoluteWebOnOneUrl('/login')}?${params.toString()}`
}

export function memberConnectedCompanyUrl(companyId: string): string {
  return webOnOneLoginUrl(`/settings/connected-companies/${companyId}`)
}

export function companyAdminCompanyUrl(companyId: string): string {
  return webOnOneLoginUrl(`/settings/companies/${companyId}`)
}
