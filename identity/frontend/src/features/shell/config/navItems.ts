import { Building2, History, Home, KeyRound, Mail, Palette, Settings, User, UserPlus, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  EMAIL_NAV_SENTINELS,
  getCoreOriginFromReturnUrl,
  isEmailNavSentinel,
  parsePlatformNavVariant,
  resolvePlatformNavUrls,
  type PlatformNavVariant,
  type ResolvedCoreNavDef,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

export const IDENTITY_SHELL_ROUTES = ['/login', '/profile', '/register', '/reset-password', '/users'] as const

const CORE_ICON_BY_PATH_SUFFIX: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  '/email': Mail,
  '/history': History,
  '/templates': Mail,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const CORE_GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
  Email: Mail,
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

function emailHrefToSentinel(href: string, emailOrigin: string): string {
  const normalizedOrigin = emailOrigin.replace(/\/$/, '')
  if (href === normalizedOrigin || href === `${normalizedOrigin}/`) {
    return EMAIL_NAV_SENTINELS.history
  }
  if (href.startsWith(`${normalizedOrigin}/`)) {
    const subPath = href.slice(normalizedOrigin.length)
    if (subPath === '/history') {
      return EMAIL_NAV_SENTINELS.history
    }
    if (subPath === '/templates') {
      return EMAIL_NAV_SENTINELS.templates
    }
  }
  return href
}

function rewriteEmailLinksForIdentityNav(
  items: NavConfigItem[],
  emailOrigin: string,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item') {
      const sentinel = emailHrefToSentinel(item.to, emailOrigin)
      if (isEmailNavSentinel(sentinel)) {
        return { ...item, to: sentinel, icon: iconForCoreHref(item.to) }
      }
      return item
    }

    return {
      ...item,
      icon: CORE_GROUP_ICON_BY_LABEL[item.label] ?? item.icon,
      children: item.children.map((child) => {
        const sentinel = emailHrefToSentinel(child.to, emailOrigin)
        if (isEmailNavSentinel(sentinel)) {
          return { ...child, to: sentinel, icon: iconForCoreHref(child.to) }
        }
        return child
      }),
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

export function buildStandaloneNav({ isSuperAdmin }: { isSuperAdmin: boolean } = { isSuperAdmin: false }): NavConfigItem[] {
  if (!isSuperAdmin) {
    return standaloneNav
  }
  return [...standaloneNav, { type: 'item', to: '/users', label: 'Users', icon: Users }]
}

const DEFAULT_EMAIL_ORIGIN = 'http://localhost:3014'

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

export { isEmailNavSentinel }
