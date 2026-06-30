import { getCoreOriginFromReturnUrl } from './coreNav'

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

/**
 * Full-page redirect to core or local login. Does not touch React state — call instead of
 * dispatch(logout()) + navigate to avoid flashing the satellite login route.
 */
export function performPlatformLogout(
  returnUrl: string | null | undefined,
  localLoginPath = '/login',
): void {
  const target = resolvePlatformLogoutLoginUrl(returnUrl, localLoginPath)
  window.location.replace(target)
}
