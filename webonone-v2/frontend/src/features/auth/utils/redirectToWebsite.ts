import { redirectWithAuthCode } from '@webonone/platform-nav'
import { getIdentityApiBase } from '@/features/auth/utils/identityConfig'

/** Hand the current WebOnOne session back to the public website via auth code. */
export async function redirectToWebsiteWithAuthCode(
  accessToken: string,
  websiteReturnUrl: string,
): Promise<void> {
  await redirectWithAuthCode({
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: websiteReturnUrl,
    errorMessage: 'Failed to return to website',
  })
}
