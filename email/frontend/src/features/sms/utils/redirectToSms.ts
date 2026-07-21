import {
  smsSentinelToExternalPath,
  toCoreNavQueryValue,
  type PlatformNavVariant,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getSmsAppUrl } from './smsConfig'

export type SmsRedirectOptions = {
  accessToken: string
  returnUrl: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
  smsPath?: string
  smsNavSentinel?: string
}

export function getSmsRedirectOptions({
  accessToken,
  returnUrl,
  extraSearchParams,
  navVariant = 'main',
  smsPath = '/send',
  smsNavSentinel,
}: SmsRedirectOptions): RedirectWithAuthCodeOptions {
  const resolvedPath =
    (smsNavSentinel ? smsSentinelToExternalPath(smsNavSentinel) : null) ?? smsPath

  return {
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getSmsAppUrl(resolvedPath),
    returnUrl,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open SMS',
  }
}
