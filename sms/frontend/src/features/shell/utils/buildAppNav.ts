import type { NavConfigItem } from '@webonone/ui-kit'
import type { PlatformNavVariant } from '@webonone/platform-nav'
import type { SmsRole } from '@/features/auth/types/auth.types'
import {
  appendPlatformQueryToLocalNav,
  buildPlatformSearchForNav,
} from '@/features/auth/utils/platformNavLinks'
import { buildStandaloneNav } from '@/features/shell/config/navItems'

export function buildAppNav(
  role: SmsRole,
  platform: {
    returnUrl: string | null
    coreNavVariant: PlatformNavVariant | null
    searchParams?: URLSearchParams
  } | null,
): NavConfigItem[] {
  const base = buildStandaloneNav(role)

  if (platform?.returnUrl) {
    const search = buildPlatformSearchForNav(platform.searchParams ?? new URLSearchParams(), {
      returnUrl: platform.returnUrl,
      coreNavVariant: platform.coreNavVariant,
    })
    return appendPlatformQueryToLocalNav(base, search ? `?${search}` : '')
  }

  return base
}
