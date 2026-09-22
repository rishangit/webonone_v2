import type { RedirectWithAuthCodeOptions } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getSupportAppUrl } from './supportConfig'

export type SupportRedirectOptions = {
  accessToken: string
  /** Support path, e.g. `/` or `/feedback`. */
  supportPath?: string
  extraSearchParams?: Record<string, string>
}

export function getSupportRedirectOptions({
  accessToken,
  supportPath = '/',
  extraSearchParams,
}: SupportRedirectOptions): RedirectWithAuthCodeOptions {
  return {
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getSupportAppUrl(supportPath),
    returnUrl: `${window.location.origin}/`,
    extraSearchParams,
    errorMessage: 'Failed to open Support',
  }
}
