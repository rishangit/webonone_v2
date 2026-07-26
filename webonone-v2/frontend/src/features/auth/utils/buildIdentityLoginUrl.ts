import { buildLoginRedirectUrl, consumeOAuthState } from '@webonone/platform-nav'
import {
  buildThemePayload,
  createPlatformDefaultThemeDto,
  serializeThemeQueryParams,
  type ColorMode,
  type ThemePayload,
} from '@webonone/theme'
import { getAuthCallbackUrl, getIdentityLoginUrl } from './identityConfig'

const STATE_STORAGE_PREFIX = 'webonone_oauth_state:'
const GUEST_COLOR_MODE_KEY = 'webonone:guest-color-mode'

export function readGuestColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(GUEST_COLOR_MODE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // ignore
  }
  return 'light'
}

export function getGuestThemePayload(): ThemePayload {
  return buildThemePayload(createPlatformDefaultThemeDto(), readGuestColorMode())
}

/** Full-page OAuth redirect to Identity (satellites / legacy). Not used by WebOnOne `/login`. */
export function buildIdentityLoginUrl(returnPath = '/'): string {
  const payload = getGuestThemePayload()
  return buildLoginRedirectUrl({
    loginUrl: getIdentityLoginUrl(),
    redirectUri: getAuthCallbackUrl(),
    returnPath,
    stateStorageKeyPrefix: STATE_STORAGE_PREFIX,
    extraSearchParams: {
      ...serializeThemeQueryParams(payload),
    },
  })
}

export function consumeAuthState(state: string): { returnPath: string } | null {
  return consumeOAuthState(state, STATE_STORAGE_PREFIX)
}
