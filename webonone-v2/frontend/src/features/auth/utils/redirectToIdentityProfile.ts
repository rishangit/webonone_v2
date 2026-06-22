import { redirectWithAuthCode, type RedirectWithAuthCodeOptions } from '@webonone/platform-nav'
import { getIdentityApiBase, getIdentityProfileUrl } from './identityConfig'

export function getIdentityProfileRedirectOptions(
  accessToken: string,
  extraSearchParams?: Record<string, string>,
): RedirectWithAuthCodeOptions {
  return {
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getIdentityProfileUrl(),
    returnUrl: `${window.location.origin}/`,
    extraSearchParams,
    errorMessage: 'Failed to open profile',
  }
}

export function redirectToIdentityProfile(
  accessToken: string,
  extraSearchParams?: Record<string, string>,
): Promise<void> {
  return redirectWithAuthCode(getIdentityProfileRedirectOptions(accessToken, extraSearchParams))
}
