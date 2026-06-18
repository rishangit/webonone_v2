import { AUTH_CALLBACK_URL, IDENTITY_LOGIN_URL } from './identityConfig'

const STATE_STORAGE_PREFIX = 'webonone_oauth_state:'

export function buildIdentityLoginUrl(returnPath = '/'): string {
  const state = crypto.randomUUID()
  sessionStorage.setItem(
    `${STATE_STORAGE_PREFIX}${state}`,
    JSON.stringify({ returnPath }),
  )

  const url = new URL(IDENTITY_LOGIN_URL)
  url.searchParams.set('redirect_uri', AUTH_CALLBACK_URL)
  url.searchParams.set('return_path', returnPath)
  url.searchParams.set('state', state)
  return url.toString()
}

export function consumeAuthState(state: string): { returnPath: string } | null {
  const key = `${STATE_STORAGE_PREFIX}${state}`
  const raw = sessionStorage.getItem(key)
  sessionStorage.removeItem(key)
  if (!raw) return null

  try {
    return JSON.parse(raw) as { returnPath: string }
  } catch {
    return null
  }
}

export function getAuthCallbackUrl(): string {
  return AUTH_CALLBACK_URL
}
