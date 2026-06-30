import type { SessionRole } from '@/features/session/types/sessionRole.types'
import type { PlatformNavVariant } from '@webonone/platform-nav'
import { sessionRoleToNavVariant } from '@/features/shell/config/navItems'

export function getNavVariantForSessionRole(role: SessionRole | null): PlatformNavVariant {
  if (!role) return 'member'
  return sessionRoleToNavVariant(role)
}
