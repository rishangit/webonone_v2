export function buildRedirectQuery(searchParams: URLSearchParams): string {
  const redirectUri = searchParams.get('redirect_uri')
  if (!redirectUri) return ''

  const params = new URLSearchParams()
  params.set('redirect_uri', redirectUri)

  const returnPath = searchParams.get('return_path')
  if (returnPath) {
    params.set('return_path', returnPath)
  }

  const state = searchParams.get('state')
  if (state) {
    params.set('state', state)
  }

  return params.toString()
}

export function withRedirectQuery(path: string, searchParams: URLSearchParams): string {
  const query = buildRedirectQuery(searchParams)
  if (!query) return path
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${query}`
}
