const RETURN_PATH_QUERY = 'return_path'

function getWebOnOneAppOrigin(): string {
  const raw = process.env.WEBONONE_FRONTEND_ORIGIN?.trim() || 'http://127.0.0.1:3010'
  return raw.replace(/\/$/, '')
}

export function webOnOneLoginUrl(returnPath?: string | null): string {
  const origin = getWebOnOneAppOrigin()
  const trimmed = returnPath?.trim()
  if (!trimmed) {
    return `${origin}/login`
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const params = new URLSearchParams()
  params.set(RETURN_PATH_QUERY, path)
  return `${origin}/login?${params.toString()}`
}
