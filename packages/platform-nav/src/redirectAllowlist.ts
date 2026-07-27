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

function matchesExactUri(uri: URL, pattern: string): boolean {
  const patternUri = parseHttpUri(pattern)
  if (!patternUri) {
    return false
  }

  return uri.href === patternUri.href
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

    return parsed.origin === patternUri.origin
  })
}
