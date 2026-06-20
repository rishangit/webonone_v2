import { redirectWithAuthCode, type RedirectWithAuthCodeOptions } from '@webonone/platform-nav'
import { IDENTITY_API_BASE, IDENTITY_PROFILE_URL } from './identityConfig'

export function getIdentityProfileRedirectOptions(
  accessToken: string,
): RedirectWithAuthCodeOptions {
  return {
    accessToken,
    authCodeEndpoint: `${IDENTITY_API_BASE}/auth/code`,
    targetUrl: IDENTITY_PROFILE_URL,
    returnUrl: `${window.location.origin}/`,
    errorMessage: 'Failed to open profile',
  }
}

export function redirectToIdentityProfile(accessToken: string): Promise<void> {
  return redirectWithAuthCode(getIdentityProfileRedirectOptions(accessToken))
}
