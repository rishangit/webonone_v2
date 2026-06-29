import { Building2, Home, KeyRound, Mail, Palette, Settings, User, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getCoreOriginFromReturnUrl,
  parsePlatformNavVariant,
  resolvePlatformNavUrls,
  type PlatformNavVariant,
  type ResolvedCoreNavDef,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

export const IDENTITY_SHELL_ROUTES = ['/login', '/profile', '/register', '/reset-password'] as const

/** Internal sentinel for Email nav — handled via `onClick` in AppLayout (not routed). */
export const PLATFORM_EMAIL_NAV = '/email'

const CORE_ICON_BY_PATH_SUFFIX: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  '/email': Mail,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const CORE_GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
}

export const standaloneNav: NavConfigItem[] = [
  { type: 'item', to: '/login', label: 'Home', icon: Home },
  { type: 'item', to: '/profile', label: 'Profile', icon: User },
  { type: 'item', to: '/register', label: 'User register', icon: UserPlus },
  { type: 'item', to: '/reset-password', label: 'Reset password', icon: KeyRound },
]

function iconForCoreHref(href: string): LucideIcon {
  try {
    const path = new URL(href).pathname
    return CORE_ICON_BY_PATH_SUFFIX[path] ?? Home
  } catch {
    return CORE_ICON_BY_PATH_SUFFIX[href] ?? Home
  }
}

function rewriteEmailLinksForIdentityNav(
  items: NavConfigItem[],
  emailOrigin: string,
): NavConfigItem[] {
  const normalizedOrigin = emailOrigin.replace(/\/$/, '')

  return items.map((item) => {
    if (item.type === 'item') {
      if (item.to === normalizedOrigin || item.to === `${normalizedOrigin}/`) {
        return { ...item, to: PLATFORM_EMAIL_NAV, icon: Mail }
      }
      return item
    }

    return {
      ...item,
      children: item.children.map((child) =>
        child.to === normalizedOrigin || child.to === `${normalizedOrigin}/`
          ? { ...child, to: PLATFORM_EMAIL_NAV, icon: Mail }
          : child,
      ),
    }
  })
}

function toNavConfigItems(defs: ResolvedCoreNavDef[], emailOrigin: string): NavConfigItem[] {
  const items: NavConfigItem[] = defs.map((item) => {
    if (item.kind === 'item') {
      return {
        type: 'item' as const,
        to: item.href,
        label: item.label,
        icon: iconForCoreHref(item.href),
      }
    }

    return {
      type: 'group' as const,
      label: item.label,
      icon: CORE_GROUP_ICON_BY_LABEL[item.label] ?? Settings,
      children: item.children.map((child) => ({
        to: child.href,
        label: child.label,
        icon: iconForCoreHref(child.href),
      })),
    }
  })

  return rewriteEmailLinksForIdentityNav(items, emailOrigin)
}

export function buildStandaloneNav(): NavConfigItem[] {
  return standaloneNav
}

const DEFAULT_EMAIL_ORIGIN = 'http://localhost:3004'

function getCoreExternalOrigins(): Partial<Record<'email', string>> {
  return {
    email: import.meta.env.VITE_EMAIL_ORIGIN ?? DEFAULT_EMAIL_ORIGIN,
  }
}

export function buildCoreNav(
  returnUrl: string,
  variant: PlatformNavVariant = 'main',
  externalOrigins: Partial<Record<'email', string>> = getCoreExternalOrigins(),
): NavConfigItem[] {
  const origin = getCoreOriginFromReturnUrl(returnUrl)
  if (!origin) {
    return standaloneNav
  }

  const emailOrigin = externalOrigins.email ?? DEFAULT_EMAIL_ORIGIN

  return toNavConfigItems(resolvePlatformNavUrls(origin, variant, externalOrigins), emailOrigin)
}

export function buildCoreNavFromQuery(
  returnUrl: string,
  coreNavQuery: string | null,
  externalOrigins: Partial<Record<'email', string>> = getCoreExternalOrigins(),
): NavConfigItem[] {
  return buildCoreNav(returnUrl, parsePlatformNavVariant(coreNavQuery), externalOrigins)
}

export function isIdentityShellRoute(pathname: string): boolean {
  return (IDENTITY_SHELL_ROUTES as readonly string[]).includes(pathname)
}
