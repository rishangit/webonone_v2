/**
 * Preserve OAuth redirect and iframe-embed query params across auth pages
 * (login ↔ register ↔ forgot/reset).
 */
export function buildRedirectQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams()

  const redirectUri = searchParams.get('redirect_uri')
  if (redirectUri) {
    params.set('redirect_uri', redirectUri)

    const returnPath = searchParams.get('return_path')
    if (returnPath) {
      params.set('return_path', returnPath)
    }

    const state = searchParams.get('state')
    if (state) {
      params.set('state', state)
    }
  }

  const parentOrigin = searchParams.get('parentOrigin')
  if (parentOrigin) {
    params.set('parentOrigin', parentOrigin)

    const embedReturnPath = searchParams.get('returnPath')
    if (embedReturnPath) {
      params.set('returnPath', embedReturnPath)
    }
  }

  return params.toString()
}

export function withRedirectQuery(path: string, searchParams: URLSearchParams): string {
  const query = buildRedirectQuery(searchParams)
  if (!query) return path
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${query}`
}
