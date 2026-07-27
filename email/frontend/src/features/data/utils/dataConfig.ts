const DEFAULT_DATA_ORIGIN = 'http://127.0.0.1:3015'

export function getDataOrigin(): string {
  return import.meta.env.VITE_DATA_ORIGIN ?? DEFAULT_DATA_ORIGIN
}

export function getDataAdminUrl(path = '/'): string {
  const base = getDataOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
