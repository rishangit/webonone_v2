const DEFAULT_DATA_ORIGIN = 'http://127.0.0.1:3015'
const DEFAULT_DATA_API_BASE_URL = 'http://127.0.0.1:4015/api/v1'

export function getDataOrigin(): string {
  return import.meta.env.VITE_DATA_ORIGIN ?? DEFAULT_DATA_ORIGIN
}

export function getDataApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_DATA_API_BASE_URL
  if (fromEnv) return fromEnv
  const origin = getDataOrigin().replace(/\/$/, '')
  // Production (same host): derive API from origin. Local defaults use separate BE port.
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return DEFAULT_DATA_API_BASE_URL
  }
  return `${origin}/api/v1`
}

export function getDataAdminUrl(path = '/'): string {
  const base = getDataOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
