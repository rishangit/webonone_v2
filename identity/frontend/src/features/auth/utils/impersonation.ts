import { decodeJwtPayload, sendAuthSuccess } from '@webonone/platform-embed'
import type { UserProfile } from '@/shared/types/auth.types'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'

function resolveExpiresIn(accessToken: string): number {
  const claims = decodeJwtPayload(accessToken)
  if (claims?.exp) {
    return Math.max(0, claims.exp - Math.floor(Date.now() / 1000))
  }
  return 900
}

type CompleteImpersonationHandoffOptions = {
  accessToken: string
  user: UserProfile
  parentOrigin: string | null
  onStandaloneNavigate: () => void
}

export function completeImpersonationHandoff({
  accessToken,
  user,
  parentOrigin,
  onStandaloneNavigate,
}: CompleteImpersonationHandoffOptions): void {
  if (parentOrigin && isAllowedParentOrigin(parentOrigin)) {
    sendAuthSuccess(parentOrigin, {
      accessToken,
      expiresIn: resolveExpiresIn(accessToken),
      user: {
        id: user.id,
        email: user.email ?? '',
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
      },
    })
    return
  }
  onStandaloneNavigate()
}

export function isImpersonatingSession(accessToken: string | null | undefined): boolean {
  if (!accessToken) {
    return false
  }
  const claims = decodeJwtPayload(accessToken)
  return Boolean(claims?.impersonated_by)
}
