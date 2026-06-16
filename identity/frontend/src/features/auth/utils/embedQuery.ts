export function buildEmbedQuery(searchParams: URLSearchParams): string {
  const parentOrigin = searchParams.get('parentOrigin')
  if (!parentOrigin) return ''

  const params = new URLSearchParams()
  params.set('parentOrigin', parentOrigin)
  const returnPath = searchParams.get('returnPath')
  if (returnPath) params.set('returnPath', returnPath)
  return `?${params.toString()}`
}

export function withEmbedQuery(path: string, searchParams: URLSearchParams): string {
  const query = buildEmbedQuery(searchParams)
  return `${path}${query}`
}
