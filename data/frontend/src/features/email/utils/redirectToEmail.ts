import {
  emailSentinelToExternalPath,
  toCoreNavQueryValue,
  type PlatformNavVariant,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getEmailAppUrl } from './emailConfig'

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
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getEmailAppUrl(resolvedPath),
    returnUrl,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open Email',
  }
}
