import { getCoreOriginFromReturnUrl } from './coreNav'

export type PlatformLogoutOptions = {
  localLoginPath?: string
  identityOrigin?: string
  /**
   * When set, used as Identity `post_logout_redirect_uri` instead of the default
   * consumer `/login?prompt=login` (e.g. a clear-session hop chain).
   */
  postLogoutRedirectUri?: string
}

export function resolvePlatformLogoutLoginUrl(
  returnUrl: string | null | undefined,
  localLoginPath = '/login',
): string {
  if (!returnUrl) {
    return localLoginPath
  }

  const origin = getCoreOriginFromReturnUrl(returnUrl)
  if (!origin) {
    return localLoginPath
  }

  return `${origin}/login`
}

/** Ensures consumer login URLs force a fresh Identity handoff (no silent SSO). */
export function appendPromptLogin(url: string): string {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1')
    if (parsed.searchParams.get('prompt') !== 'login') {
      parsed.searchParams.set('prompt', 'login')
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return parsed.toString()
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return url
  }
}

/**
 * Absolute consumer (or local) login URL after logout.
 * Always includes `prompt=login` so the consumer clears local JWT and Identity
 * does not silently re-auth via leftover SSO session.
 */
export function resolveAbsolutePostLogoutLoginUrl(
  returnUrl: string | null | undefined,
  localLoginPath = '/login',
): string {
  const pathOrUrl = resolvePlatformLogoutLoginUrl(returnUrl, localLoginPath)
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return appendPromptLogin(pathOrUrl)
  }

  if (typeof window === 'undefined') {
    return appendPromptLogin(pathOrUrl)
  }

  const absolute = `${window.location.origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
  return appendPromptLogin(absolute)
}

export function buildIdentityLogoutUrl(
  identityOrigin: string,
  postLogoutRedirectUri: string,
): string {
  const base = identityOrigin.replace(/\/$/, '')
  const url = new URL(`${base}/logout`)
  url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri)
  return url.toString()
}

/** `{origin}/auth/clear-session?continue=…` hop used in global logout chains. */
export function buildClearSessionUrl(serviceOrigin: string, continueUrl: string): string {
  const base = serviceOrigin.replace(/\/$/, '')
  const url = new URL(`${base}/auth/clear-session`)
  url.searchParams.set('continue', continueUrl)
  return url.toString()
}

/**
 * Nest clear-session hops (first origin clears first), then continue to `finalUrl`.
 */
export function buildLogoutClearChain(clearOrigins: string[], finalUrl: string): string {
  return clearOrigins.reduceRight(
    (continueUrl, origin) => buildClearSessionUrl(origin, continueUrl),
    finalUrl,
  )
}

/**
 * Peer clear-session hop(s) first, then Identity `/logout`, then `finalUrl`.
 * Clearing peers before Identity prevents SSO re-login when Identity redirect fails
 * or the tab remounts before a post-Identity clear hop runs.
 */
export function buildClearFirstLogoutUrl(
  clearOrigins: string[],
  identityOrigin: string,
  finalUrl: string,
): string {
  return buildLogoutClearChain(clearOrigins, buildIdentityLogoutUrl(identityOrigin, finalUrl))
}

/**
 * Full-page redirect to login after sign-out. When `identityOrigin` is set, routes through
 * Identity `/logout` to revoke SSO sessions before landing on the target login URL.
 */
export function performPlatformLogout(
  returnUrl: string | null | undefined,
  options?: PlatformLogoutOptions,
): void {
  const localLoginPath = options?.localLoginPath ?? '/login'
  const postLogoutTarget =
    options?.postLogoutRedirectUri ??
    resolveAbsolutePostLogoutLoginUrl(returnUrl, localLoginPath)

  if (options?.identityOrigin) {
    window.location.replace(buildIdentityLogoutUrl(options.identityOrigin, postLogoutTarget))
    return
  }

  window.location.replace(postLogoutTarget)
}
