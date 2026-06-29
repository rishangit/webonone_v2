import {
  toCoreNavQueryValue,
  type PlatformNavVariant,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getEmailHomeRedirectUri } from './emailConfig'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_IDENTITY_API_BASE_URL ??
  'http://localhost:4001/api/v1'

export type EmailRedirectOptions = {
  accessToken: string
  returnUrl: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
}

export function getEmailRedirectOptions({
  accessToken,
  returnUrl,
  extraSearchParams,
  navVariant = 'main',
}: EmailRedirectOptions): RedirectWithAuthCodeOptions {
  return {
    accessToken,
    authCodeEndpoint: `${API_BASE}/auth/code`,
    targetUrl: getEmailHomeRedirectUri(),
    returnUrl,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open Email',
  }
}
