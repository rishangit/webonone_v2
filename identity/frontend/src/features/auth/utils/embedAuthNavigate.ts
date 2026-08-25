import { QUERY } from '@webonone/platform-nav'

const STRIPPED_IDENTITY_PARAMS = new Set([
  'parentOrigin',
  'returnPath',
  'redirect_uri',
  'return_path',
  'state',
])

function parseIdentityAuthTarget(identityPath: string): {
  pathname: string
  identitySearch: URLSearchParams
} {
  const qIndex = identityPath.indexOf('?')
  const pathname = qIndex >= 0 ? identityPath.slice(0, qIndex) : identityPath
  const identitySearch = new URLSearchParams(qIndex >= 0 ? identityPath.slice(qIndex + 1) : '')
  return { pathname, identitySearch }
}

/** Map Identity guest-auth path + query to the parent host route (e.g. WebOnOne). */
export function mapIdentityAuthPathToParent(
  identityPath: string,
  pageSearchParams: URLSearchParams,
): { pathname: string; search?: string } {
  const { pathname, identitySearch } = parseIdentityAuthTarget(identityPath)

  const parentSearch = new URLSearchParams()

  identitySearch.forEach((value, key) => {
    if (!STRIPPED_IDENTITY_PARAMS.has(key)) {
      parentSearch.set(key, value)
    }
  })

  const returnPath =
    identitySearch.get('returnPath') ??
    pageSearchParams.get('returnPath') ??
    pageSearchParams.get('return_path') ??
    '/'
  parentSearch.set(QUERY.RETURN_PATH, returnPath)

  const prompt = identitySearch.get('prompt') ?? pageSearchParams.get('prompt')
  if (prompt) {
    parentSearch.set('prompt', prompt)
  }

  const searchStr = parentSearch.toString()
  return {
    pathname,
    ...(searchStr ? { search: `?${searchStr}` } : {}),
  }
}
