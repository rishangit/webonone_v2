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
