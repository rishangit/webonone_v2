import {
  smsSentinelToExternalPath,
  toCoreNavQueryValue,
  type PlatformNavVariant,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getSmsAppUrl } from './smsConfig'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_IDENTITY_API_BASE_URL ??
  'http://localhost:4011/api/v1'

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
    authCodeEndpoint: `${API_BASE}/auth/code`,
    targetUrl: getSmsAppUrl(resolvedPath),
    returnUrl,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open SMS',
  }
}
