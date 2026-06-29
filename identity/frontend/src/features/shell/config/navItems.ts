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
    return Home
  }
}

function toNavConfigItems(defs: ResolvedCoreNavDef[]): NavConfigItem[] {
  return defs.map((item) => {
    if (item.kind === 'item') {
      return {
        type: 'item',
        to: item.href,
        label: item.label,
        icon: iconForCoreHref(item.href),
      }
    }

    return {
      type: 'group',
      label: item.label,
      icon: CORE_GROUP_ICON_BY_LABEL[item.label] ?? Settings,
      children: item.children.map((child) => ({
        to: child.href,
        label: child.label,
        icon: iconForCoreHref(child.href),
      })),
    }
  })
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

  return toNavConfigItems(resolvePlatformNavUrls(origin, variant, externalOrigins))
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
