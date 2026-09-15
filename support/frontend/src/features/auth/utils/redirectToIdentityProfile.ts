import {
  redirectWithAuthCode,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getIdentityApiBase, getIdentityProfileUrl } from './identityConfig'

export function getIdentityProfileRedirectOptions({
  accessToken,
  returnUrl,
}: {
  accessToken: string
  returnUrl: string
}): RedirectWithAuthCodeOptions {
  return {
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getIdentityProfileUrl(),
    returnUrl,
    errorMessage: 'Failed to open profile',
  }
}

export function redirectToIdentityProfile(options: {
  accessToken: string
  returnUrl: string
}): Promise<void> {
  return redirectWithAuthCode(getIdentityProfileRedirectOptions(options))
}
