import { getCoreOriginFromReturnUrl } from './coreNav'

export type PlatformLogoutOptions = {
  localLoginPath?: string
  identityOrigin?: string
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

/**
 * Full-page redirect to login after sign-out. When `identityOrigin` is set, routes through
 * Identity `/logout` to revoke SSO sessions before landing on the target login URL.
 */
export function performPlatformLogout(
  returnUrl: string | null | undefined,
  options?: PlatformLogoutOptions,
): void {
  const localLoginPath = options?.localLoginPath ?? '/login'
  const postLogoutTarget = resolveAbsolutePostLogoutLoginUrl(returnUrl, localLoginPath)

  if (options?.identityOrigin) {
    window.location.replace(buildIdentityLogoutUrl(options.identityOrigin, postLogoutTarget))
    return
  }

  window.location.replace(postLogoutTarget)
}
