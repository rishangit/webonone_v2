import { redirectWithAuthCode } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'

const DEFAULT_WEBONONE_ORIGIN = 'http://127.0.0.1:3010'

export function getWebOnOneOrigin(): string {
  const fromEnv = import.meta.env.VITE_WEBONONE_ORIGIN?.trim()
  return (fromEnv || DEFAULT_WEBONONE_ORIGIN).replace(/\/$/, '')
}

/** Authenticated WebOnOne app home (guest Open App / deep link). */
export function getWebOnOneAppUrl(): string {
  return `${getWebOnOneOrigin()}/`
}

/** Public handoff route that exchanges an auth code into webonone_auth. */
export function getWebOnOneAuthHandoffUrl(): string {
  return `${getWebOnOneOrigin()}/auth/handoff`
}

/** Open App while logged into the website — share session via Identity auth code. */
export async function redirectToWebOnOneApp(accessToken: string): Promise<void> {
  await redirectWithAuthCode({
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getWebOnOneAuthHandoffUrl(),
    errorMessage: 'Failed to open WebOnOne app',
  })
}
