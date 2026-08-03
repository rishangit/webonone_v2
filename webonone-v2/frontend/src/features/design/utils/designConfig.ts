const DEFAULT_DESIGN_ORIGIN = 'http://127.0.0.1:3019'

export function getDesignOrigin(): string {
  return import.meta.env.VITE_DESIGN_ORIGIN ?? DEFAULT_DESIGN_ORIGIN
}

export function getDesignAppUrl(path = '/forms'): string {
  const base = getDesignOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
