import type { RedirectWithAuthCodeOptions } from '@webonone/platform-nav'
import {
  emailSentinelToExternalPath,
  toCoreNavQueryValue,
  type PlatformNavVariant,
} from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getEmailAppUrl } from './emailConfig'

export type EmailRedirectOptions = {
  accessToken: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
  /** Email service path, e.g. `/history` or `/templates`. */
  emailPath?: string
  /** Core nav sentinel from `@webonone/platform-nav` (resolved to `emailPath` when set). */
  emailNavSentinel?: string
}

export function getEmailRedirectOptions({
  accessToken,
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
    returnUrl: `${window.location.origin}/`,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open Email',
  }
}
