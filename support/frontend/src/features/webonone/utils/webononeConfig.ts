import { redirectWithAuthCode } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'
import { getWebOnOneOrigin } from '@/features/docs/utils/peerConfig'

export function getWebOnOneAuthHandoffUrl(): string {
  return `${getWebOnOneOrigin()}/auth/handoff`
}

export async function redirectToWebOnOneApp(accessToken: string): Promise<void> {
  await redirectWithAuthCode({
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: getWebOnOneAuthHandoffUrl(),
    errorMessage: 'Failed to open WebOnOne app',
  })
}
