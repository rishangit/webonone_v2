function parseHttpUri(value: string): URL | null {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function parseAllowlistPatterns(raw: string): string[] {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function hostMatchesSubdomainWildcard(host: string, baseDomain: string): boolean {
  if (host === baseDomain) {
    return false
  }
  return host.endsWith(`.${baseDomain}`)
}

function matchesHostWildcardUri(uri: URL, pattern: string): boolean {
  const match = pattern.match(/^(https?):\/\/\*\.([^/?#]+)$/)
  if (!match) {
    return false
  }

  const [, scheme, baseDomain] = match
  if (uri.protocol !== `${scheme}:`) {
    return false
  }

  return hostMatchesSubdomainWildcard(uri.hostname, baseDomain)
}

const LOOPBACK_DEV_PATTERNS = new Set(['http://localhost:*', 'http://127.0.0.1:*'])

function matchesLocalhostUri(uri: URL, pattern: string): boolean {
  if (!LOOPBACK_DEV_PATTERNS.has(pattern)) {
    return false
  }

  if (uri.protocol !== 'http:') {
    return false
  }

  return uri.hostname === 'localhost' || uri.hostname === '127.0.0.1'
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function loopbackAliasOrigin(uri: URL): string | null {
  if (!isLoopbackHost(uri.hostname)) {
    return null
  }

  const alias = new URL(uri.href)
  alias.hostname = uri.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
  return alias.origin
}

/** Exact origins match, or localhost ↔ 127.0.0.1 with the same protocol and port. */
function originsEqualWithLoopbackAlias(a: URL, b: URL): boolean {
  if (a.origin === b.origin) {
    return true
  }

  const aAlias = loopbackAliasOrigin(a)
  return aAlias !== null && aAlias === b.origin
}

/**
 * Expands each http(s) origin whose host is `localhost` or `127.0.0.1` to also
 * include the other loopback host with the same protocol and port (deduped).
 * Non-loopback and non-http(s) entries are kept as-is.
 */
export function expandLoopbackOrigins(origins: string[]): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  for (const entry of origins) {
    const origin = entry.trim()
    if (!origin || seen.has(origin)) {
      continue
    }

    seen.add(origin)
    result.push(origin)

    const parsed = parseHttpUri(origin)
    if (!parsed || !isLoopbackHost(parsed.hostname)) {
      continue
    }

    const alias = loopbackAliasOrigin(parsed)
    if (!alias || seen.has(alias)) {
      continue
    }

    seen.add(alias)
    result.push(alias)
  }

  return result
}

function matchesExactUri(uri: URL, pattern: string): boolean {
  const patternUri = parseHttpUri(pattern)
  if (!patternUri) {
    return false
  }

  if (uri.href === patternUri.href) {
    return true
  }

  // Origin-only patterns (`https://example.com` or `…/`) match any path on that origin.
  const isOriginOnly =
    (patternUri.pathname === '/' || patternUri.pathname === '') &&
    !patternUri.search &&
    !patternUri.hash
  if (!isOriginOnly) {
    return false
  }

  return (
    uri.protocol === patternUri.protocol &&
    uri.hostname === patternUri.hostname &&
    uri.port === patternUri.port
  )
}

function matchesPatternUri(uri: URL, pattern: string): boolean {
  if (pattern.includes('://*.')) {
    return matchesHostWildcardUri(uri, pattern)
  }

  if (LOOPBACK_DEV_PATTERNS.has(pattern)) {
    return matchesLocalhostUri(uri, pattern)
  }

  return matchesExactUri(uri, pattern)
}

export function matchesRedirectUri(uri: string, patterns: string[]): boolean {
  const parsed = parseHttpUri(uri)
  if (!parsed) {
    return false
  }

  return patterns.some((pattern) => matchesPatternUri(parsed, pattern))
}

export function matchesAllowedOrigin(origin: string, patterns: string[]): boolean {
  const parsed = parseHttpUri(origin)
  if (!parsed) {
    return false
  }

  return patterns.some((pattern) => {
    if (pattern.includes('://*.')) {
      return matchesHostWildcardUri(parsed, pattern)
    }

    if (LOOPBACK_DEV_PATTERNS.has(pattern)) {
      return matchesLocalhostUri(parsed, pattern)
    }

    const patternUri = parseHttpUri(pattern)
    if (!patternUri) {
      return false
    }

    return originsEqualWithLoopbackAlias(parsed, patternUri)
  })
}
