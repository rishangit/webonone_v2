import { DEFAULT_OAUTH_STATE_PREFIX, QUERY } from './constants'
import type { BuildLoginRedirectOptions, OAuthStatePayload } from './types'

export function buildLoginRedirectUrl(opts: BuildLoginRedirectOptions): string {
  const prefix = opts.stateStorageKeyPrefix ?? DEFAULT_OAUTH_STATE_PREFIX
  const returnPath = opts.returnPath ?? '/'
  const state = crypto.randomUUID()

  sessionStorage.setItem(`${prefix}${state}`, JSON.stringify({ returnPath } satisfies OAuthStatePayload))

  const url = new URL(opts.loginUrl)
  url.searchParams.set(QUERY.REDIRECT_URI, opts.redirectUri)
  url.searchParams.set(QUERY.RETURN_PATH, returnPath)
  url.searchParams.set(QUERY.STATE, state)
  return url.toString()
}

export function consumeOAuthState(
  state: string,
  prefix = DEFAULT_OAUTH_STATE_PREFIX,
): OAuthStatePayload | null {
  const key = `${prefix}${state}`
  const raw = sessionStorage.getItem(key)
  sessionStorage.removeItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw) as OAuthStatePayload
  } catch {
    return null
  }
}
