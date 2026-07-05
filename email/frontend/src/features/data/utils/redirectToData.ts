import {
  dataSentinelToExternalPath,
  toCoreNavQueryValue,
  type PlatformNavVariant,
  type RedirectWithAuthCodeOptions,
} from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getDataAdminUrl } from './dataConfig'

export type DataRedirectOptions = {
  accessToken: string
  returnUrl: string
  extraSearchParams?: Record<string, string>
  navVariant?: PlatformNavVariant
  dataPath?: string
  dataNavSentinel?: string
}

export function getDataRedirectOptions({
  accessToken,
  returnUrl,
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
    returnUrl,
    extraSearchParams: {
      ...extraSearchParams,
      core_nav: toCoreNavQueryValue(navVariant),
    },
    errorMessage: 'Failed to open Data',
  }
}
