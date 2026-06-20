import { buildLoginRedirectUrl, consumeOAuthState } from '@webonone/platform-nav'
import { AUTH_CALLBACK_URL, IDENTITY_LOGIN_URL } from './identityConfig'

const STATE_STORAGE_PREFIX = 'webonone_oauth_state:'

export function buildIdentityLoginUrl(returnPath = '/'): string {
  return buildLoginRedirectUrl({
    loginUrl: IDENTITY_LOGIN_URL,
    redirectUri: AUTH_CALLBACK_URL,
    returnPath,
    stateStorageKeyPrefix: STATE_STORAGE_PREFIX,
  })
}

export function consumeAuthState(state: string): { returnPath: string } | null {
  return consumeOAuthState(state, STATE_STORAGE_PREFIX)
}

export function getAuthCallbackUrl(): string {
  return AUTH_CALLBACK_URL
}
