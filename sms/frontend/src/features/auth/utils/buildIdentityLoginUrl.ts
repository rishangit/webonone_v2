import { buildLoginRedirectUrl, consumeOAuthState } from '@webonone/platform-nav'
import { relayLocaleQueryParams } from '@webonone/i18n'
import { relayListPageModeQueryParams, relayThemeQueryParams } from '@webonone/theme'
import { getAuthCallbackUrl, getIdentityLoginUrl } from './identityConfig'

const STATE_STORAGE_PREFIX = 'sms_oauth_state:'

export function buildIdentityLoginUrl(returnPath = '/'): string {
  const searchParams = new URLSearchParams(window.location.search)
  return buildLoginRedirectUrl({
    loginUrl: getIdentityLoginUrl(),
    redirectUri: getAuthCallbackUrl(),
    returnPath,
    stateStorageKeyPrefix: STATE_STORAGE_PREFIX,
    extraSearchParams: {
      ...relayThemeQueryParams(searchParams),
      ...relayListPageModeQueryParams(searchParams),
      ...relayLocaleQueryParams(searchParams),
    },
  })
}

export function consumeAuthState(state: string): { returnPath: string } | null {
  return consumeOAuthState(state, STATE_STORAGE_PREFIX)
}
