import { parseCoreReturnPath, redirectWithAuthCode } from '@webonone/platform-nav'
import { getIdentityApiBase, getWebOnOneOrigin } from './identityConfig'

export function getWebOnOneAuthHandoffUrl(): string {
  return `${getWebOnOneOrigin()}/auth/handoff`
}

export async function redirectToWebOnOnePath(accessToken: string, path: string): Promise<void> {
  const returnPath = parseCoreReturnPath(path)
  if (!returnPath) {
    throw new Error('Invalid page path')
  }
  const target = new URL(getWebOnOneAuthHandoffUrl())
  target.searchParams.set('return_path', returnPath)
  await redirectWithAuthCode({
    accessToken,
    authCodeEndpoint: `${getIdentityApiBase()}/auth/code`,
    targetUrl: target.toString(),
    errorMessage: 'Failed to open page',
  })
}
