import { redirectWithAuthCode } from '@webonone/platform-nav'
import { relayThemeQueryParams } from '@webonone/theme'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_IDENTITY_API_BASE_URL ??
  'http://localhost:4001/api/v1'

export async function completeAuthRedirect(
  accessToken: string,
  redirectUri: string,
  state: string,
): Promise<void> {
  return redirectWithAuthCode({
    accessToken,
    authCodeEndpoint: `${API_BASE}/auth/code`,
    targetUrl: redirectUri,
    state,
    extraSearchParams: relayThemeQueryParams(new URLSearchParams(window.location.search)),
    errorMessage: 'Failed to create authorization code',
  })
}
