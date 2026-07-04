import { buildLoginRedirectUrl, consumeOAuthState } from '@webonone/platform-nav'
import {
  buildThemePayload,
  createPlatformDefaultThemeDto,
  serializeThemeQueryParams,
  type ColorMode,
} from '@webonone/theme'
import { getAuthCallbackUrl, getIdentityLoginUrl } from './identityConfig'

const STATE_STORAGE_PREFIX = 'webonone_oauth_state:'
const GUEST_COLOR_MODE_KEY = 'webonone:guest-color-mode'

function readGuestColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(GUEST_COLOR_MODE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // ignore
  }
  return 'light'
}

export function buildIdentityLoginUrl(returnPath = '/'): string {
  const payload = buildThemePayload(createPlatformDefaultThemeDto(), readGuestColorMode())
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
