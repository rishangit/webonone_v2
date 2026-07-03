import type { NavConfigItem } from '@webonone/ui-kit'
import { toCoreNavQueryValue, type PlatformNavVariant } from '@webonone/platform-nav'
import type { DataRole } from '@/features/auth/types/auth.types'
import {
  appendPlatformQueryToLocalNav,
  buildPlatformSearchForNav,
} from '@/features/auth/utils/platformNavLinks'
import { buildCoreNavFromQuery } from '@/features/shell/config/coreNavItems'
import { buildStandaloneNav } from '@/features/shell/config/navItems'

export function buildAppNav(
  role: DataRole,
  platform: {
    returnUrl: string | null
    coreNavVariant: PlatformNavVariant | null
    searchParams?: URLSearchParams
  } | null,
): NavConfigItem[] {
  if (platform?.returnUrl) {
    const coreNav = buildCoreNavFromQuery(
      platform.returnUrl,
      platform.coreNavVariant ? toCoreNavQueryValue(platform.coreNavVariant) : null,
    )
    const search = buildPlatformSearchForNav(platform.searchParams ?? new URLSearchParams(), {
      returnUrl: platform.returnUrl,
      coreNavVariant: platform.coreNavVariant,
    })
    return appendPlatformQueryToLocalNav(coreNav, search ? `?${search}` : '')
  }

  return buildStandaloneNav(role)
}
