import {
  redirectWithAuthCode,
  toCoreNavQueryValue,
  type PlatformNavVariant,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getIdentityApiBase, getIdentityProfileUrl } from './identityConfig'

export type IdentityProfileRedirectOptions = {
  accessToken: string
  returnUrl: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
}

export function getIdentityProfileRedirectOptions({
  accessToken,
  returnUrl,
  extraSearchParams,
  navVariant = 'main',
}: IdentityProfileRedirectOptions): RedirectWithAuthCodeOptions {
  return {
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getIdentityProfileUrl(),
    returnUrl,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open profile',
  }
}

export function redirectToIdentityProfile(
  options: IdentityProfileRedirectOptions,
): Promise<void> {
  return redirectWithAuthCode(getIdentityProfileRedirectOptions(options))
}
