const DEFAULT_EMAIL_ORIGIN = 'http://127.0.0.1:3014'

export function getEmailOrigin(): string {
  return import.meta.env.VITE_EMAIL_ORIGIN ?? DEFAULT_EMAIL_ORIGIN
}

export function getEmailAppUrl(path = '/templates'): string {
  const base = getEmailOrigin().replace(/\/$/, '')
  if (path === '/' || path === '') {
    return `${base}/`
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Platform template slug for feedback comment notifications (Email → Templates). */
export const FEEDBACK_COMMENT_EMAIL_TEMPLATE_SLUG = 'feedback_comment'
