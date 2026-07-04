import { buildLoginRedirectUrl, consumeOAuthState } from '@webonone/platform-nav'
import { relayThemeQueryParams } from '@webonone/theme'
import { getAuthCallbackUrl, getIdentityLoginUrl } from './identityConfig'

const STATE_STORAGE_PREFIX = 'email_oauth_state:'

export function buildIdentityLoginUrl(returnPath = '/'): string {
  return buildLoginRedirectUrl({
    loginUrl: getIdentityLoginUrl(),
    redirectUri: getAuthCallbackUrl(),
    returnPath,
    stateStorageKeyPrefix: STATE_STORAGE_PREFIX,
    extraSearchParams: {
      ...relayThemeQueryParams(new URLSearchParams(window.location.search)),
    },
  })
}

export function consumeAuthState(state: string): { returnPath: string } | null {
  return consumeOAuthState(state, STATE_STORAGE_PREFIX)
}
