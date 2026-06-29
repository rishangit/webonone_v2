import type { NavConfigItem } from '@webonone/ui-kit'
import {
  toCoreNavQueryValue,
  type PlatformNavVariant,
} from '@webonone/platform-nav'
import type { EmailRole } from '@/features/auth/types/auth.types'
import { buildCoreNavFromQuery } from '@/features/shell/config/coreNavItems'
import { emailNavItems } from '@/features/shell/config/navItems'

export function buildAppNav(
  role: EmailRole,
  platform: { returnUrl: string | null; coreNavVariant: PlatformNavVariant | null } | null,
): NavConfigItem[] {
  if (platform?.returnUrl) {
    return buildCoreNavFromQuery(
      platform.returnUrl,
      platform.coreNavVariant ? toCoreNavQueryValue(platform.coreNavVariant) : null,
    )
  }

  return emailNavItems
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      type: 'item' as const,
      to: item.to,
      label: item.label,
      icon: item.icon,
    }))
}
