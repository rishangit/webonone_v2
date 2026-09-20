import { appendPromptLogin, buildClearFirstLogoutUrl } from '@webonone/platform-nav'
import { clearIdentityEmbedSession } from '@webonone/platform-embed'
import { clearWebOnOneAuthStorage } from '@/features/auth/store/authSlice'
import { getIdentityOrigin } from '@/features/auth/utils/identityConfig'
import { getWebsiteOrigin } from '@/features/auth/utils/websiteConfig'
import { clearSessionRoleStorage } from '@/features/session/utils/sessionRoleStorage'

/** Clear local auth/session state and navigate through the clear-first logout chain. */
export function performWebOnOneLogout(): void {
  const websiteOrigin = getWebsiteOrigin()
  const loginUrl = appendPromptLogin(`${window.location.origin}/login`)
  const identityOrigin = getIdentityOrigin()
  const logoutUrl = buildClearFirstLogoutUrl([websiteOrigin], identityOrigin, loginUrl)

  clearWebOnOneAuthStorage()
  clearSessionRoleStorage()
  void clearIdentityEmbedSession({ identityOrigin })
  window.location.replace(logoutUrl)
}
