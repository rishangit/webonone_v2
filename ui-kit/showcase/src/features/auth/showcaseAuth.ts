import {
  clearServiceAuthSession,
  isAccessTokenExpired,
  readServiceAuthSession,
  writeServiceAuthSession,
} from '@webonone/platform-embed'
import { buildLoginRedirectUrl, consumeOAuthState, exchangeAuthCode } from '@webonone/platform-nav'

export const SHOWCASE_AUTH_STORAGE_KEY = 'showcase_demo_auth'
const OAUTH_STATE_PREFIX = 'showcase_oauth_state:'

export function getIdentityOrigin(): string {
  return (import.meta.env.VITE_IDENTITY_ORIGIN ?? 'http://127.0.0.1:3011').replace(/\/$/, '')
}

export function getMediaOrigin(): string {
  return (import.meta.env.VITE_MEDIA_ORIGIN ?? 'http://127.0.0.1:3013').replace(/\/$/, '')
}

export function getDataOrigin(): string {
  return (import.meta.env.VITE_DATA_ORIGIN ?? 'http://127.0.0.1:3015').replace(/\/$/, '')
}

export function getIdentityApiBase(): string {
  return (
    import.meta.env.VITE_IDENTITY_API_BASE_URL ?? 'http://127.0.0.1:4011/api/v1'
  ).replace(/\/$/, '')
}

export function getShowcaseAuthCallbackUrl(): string {
  return `${window.location.origin}/callback`
}

export function readShowcaseAccessToken(): string | null {
  const fromEnv = import.meta.env.VITE_SHOWCASE_ACCESS_TOKEN?.trim() ?? ''
  if (
    fromEnv.length > 0 &&
    fromEnv !== 'your_token_here' &&
    !fromEnv.includes(' ') &&
    !isAccessTokenExpired(fromEnv)
  ) {
    return fromEnv
  }

  const stored = readServiceAuthSession(SHOWCASE_AUTH_STORAGE_KEY)
  if (!stored?.accessToken || isAccessTokenExpired(stored.accessToken)) {
    return null
  }
  return stored.accessToken
}

export function writeShowcaseAccessToken(accessToken: string, user: unknown): void {
  writeServiceAuthSession(SHOWCASE_AUTH_STORAGE_KEY, {
    accessToken,
    user,
  })
}

export function clearShowcaseAccessToken(): void {
  clearServiceAuthSession(SHOWCASE_AUTH_STORAGE_KEY)
}

export function buildShowcaseLoginUrl(returnPath = '/#complex-controls'): string {
  return buildLoginRedirectUrl({
    loginUrl: `${getIdentityOrigin()}/login`,
    redirectUri: getShowcaseAuthCallbackUrl(),
    returnPath,
    stateStorageKeyPrefix: OAUTH_STATE_PREFIX,
  })
}

export function consumeShowcaseAuthState(state: string): { returnPath: string } | null {
  return consumeOAuthState(state, OAUTH_STATE_PREFIX)
}

export async function exchangeShowcaseAuthCode(code: string): Promise<string> {
  const result = await exchangeAuthCode({
    identityApiBase: getIdentityApiBase(),
    code,
    redirectUri: getShowcaseAuthCallbackUrl(),
  })
  writeShowcaseAccessToken(result.accessToken, result.user)
  return result.accessToken
}
