import type { RedirectWithAuthCodeOptions } from '@webonone/platform-nav'
import { toCoreNavQueryValue, type PlatformNavVariant } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getEmailAppUrl } from './emailConfig'

export type EmailRedirectOptions = {
  accessToken: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
}

export function getEmailRedirectOptions({
  accessToken,
  extraSearchParams,
  navVariant = 'main',
}: EmailRedirectOptions): RedirectWithAuthCodeOptions {
  return {
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getEmailAppUrl(),
    returnUrl: `${window.location.origin}/`,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open Email',
  }
}