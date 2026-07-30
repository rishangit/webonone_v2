const DEFAULT_PAYMENT_ORIGIN = 'http://127.0.0.1:3017'

export function getPaymentOrigin(): string {
  return import.meta.env.VITE_PAYMENT_ORIGIN ?? DEFAULT_PAYMENT_ORIGIN
}

export function getPaymentAppUrl(path = '/invoices'): string {
  const base = getPaymentOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
