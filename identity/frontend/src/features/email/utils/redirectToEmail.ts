import {
  emailSentinelToExternalPath,
  toCoreNavQueryValue,
  type PlatformNavVariant,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getEmailAppUrl } from './emailConfig'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_IDENTITY_API_BASE_URL ??
  'http://localhost:4011/api/v1'

export type EmailRedirectOptions = {
  accessToken: string
  returnUrl: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
  emailPath?: string
  emailNavSentinel?: string
}

export function getEmailRedirectOptions({
  accessToken,
  returnUrl,
  extraSearchParams,
  navVariant = 'main',
  emailPath = '/history',
  emailNavSentinel,
}: EmailRedirectOptions): RedirectWithAuthCodeOptions {
  const resolvedPath =
    (emailNavSentinel ? emailSentinelToExternalPath(emailNavSentinel) : null) ?? emailPath

  return {
    accessToken,
    authCodeEndpoint: `${API_BASE}/auth/code`,
    targetUrl: getEmailAppUrl(resolvedPath),
    returnUrl,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open Email',
  }
}
