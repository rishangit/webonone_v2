import type { RedirectWithAuthCodeOptions } from '@webonone/platform-nav'
import {
  dataSentinelToExternalPath,
  toCoreNavQueryValue,
  type PlatformNavVariant,
} from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getDataAdminUrl } from './dataConfig'

export type DataRedirectOptions = {
  accessToken: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
  dataPath?: string
  dataNavSentinel?: string
}

export function getDataRedirectOptions({
  accessToken,
  extraSearchParams,
  navVariant = 'main',
  dataPath = '/',
  dataNavSentinel,
}: DataRedirectOptions): RedirectWithAuthCodeOptions {
  const resolvedPath =
    (dataNavSentinel ? dataSentinelToExternalPath(dataNavSentinel) : null) ?? dataPath

  return {
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getDataAdminUrl(resolvedPath),
    returnUrl: `${window.location.origin}/`,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open Data',
  }
}
