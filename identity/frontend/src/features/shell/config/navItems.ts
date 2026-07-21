import { Building2, History, Home, KeyRound, Mail, MessageSquare, Palette, Rows3, Send, Settings, User, UserPlus, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  EMAIL_NAV_SENTINELS,
  SMS_NAV_SENTINELS,
  getCoreOriginFromReturnUrl,
  isEmailNavSentinel,
  isSmsNavSentinel,
  parsePlatformNavVariant,
  resolvePlatformNavUrls,
  type ExternalServiceId,
  type PlatformNavVariant,
  type ResolvedCoreNavDef,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

export const IDENTITY_SHELL_ROUTES = ['/login', '/profile', '/register', '/reset-password', '/users'] as const

const CORE_ICON_BY_PATH_SUFFIX: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  '/email': Mail,
  '/send': Send,
  '/queue': Rows3,
  '/history': History,
  '/templates': Mail,
  '/sms/send': MessageSquare,
  '/sms/devices': MessageSquare,
  '/sms/queue': MessageSquare,
  '/sms/history': History,
  '/sms/templates': MessageSquare,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const CORE_GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings: Settings,
  Email: Mail,
  SMS: MessageSquare,
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
    return EMAIL_NAV_SENTINELS.send
  }
  if (href.startsWith(`${normalizedOrigin}/`)) {
    const subPath = href.slice(normalizedOrigin.length)
    if (subPath === '/send') {
      return EMAIL_NAV_SENTINELS.send
    }
    if (subPath === '/queue') {
      return EMAIL_NAV_SENTINELS.queue
    }
    if (subPath === '/history') {
      return EMAIL_NAV_SENTINELS.history
    }
    if (subPath === '/templates') {
      return EMAIL_NAV_SENTINELS.templates
    }
  }
  return href
}

function smsHrefToSentinel(href: string, smsOrigin: string): string {
  const normalizedOrigin = smsOrigin.replace(/\/$/, '')
  if (href.startsWith(`${normalizedOrigin}/`)) {
    const subPath = href.slice(normalizedOrigin.length)
    if (subPath === '/send') {
      return SMS_NAV_SENTINELS.send
    }
    if (subPath === '/devices') {
      return SMS_NAV_SENTINELS.devices
    }
    if (subPath === '/queue') {
      return SMS_NAV_SENTINELS.queue
    }
    if (subPath === '/history') {
      return SMS_NAV_SENTINELS.history
    }
    if (subPath === '/templates') {
      return SMS_NAV_SENTINELS.templates
    }
  }

  try {
    const { pathname } = new URL(href)
    if (isSmsNavSentinel(pathname)) {
      return pathname
    }
  } catch {
    if (isSmsNavSentinel(href)) {
      return href
    }
  }

  return href
}

function rewritePeerLinksForIdentityNav(
  items: NavConfigItem[],
  emailOrigin: string,
  smsOrigin: string,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item') {
      const emailSentinel = emailHrefToSentinel(item.to, emailOrigin)
      if (isEmailNavSentinel(emailSentinel)) {
        return { ...item, to: emailSentinel, icon: iconForCoreHref(item.to) }
      }
      const smsSentinel = smsHrefToSentinel(item.to, smsOrigin)
      if (isSmsNavSentinel(smsSentinel)) {
        return { ...item, to: smsSentinel, icon: iconForCoreHref(item.to) }
      }
      return item
    }

    return {
      ...item,
      icon: CORE_GROUP_ICON_BY_LABEL[item.label] ?? item.icon,
      children: item.children.map((child) => {
        const emailSentinel = emailHrefToSentinel(child.to, emailOrigin)
        if (isEmailNavSentinel(emailSentinel)) {
          return { ...child, to: emailSentinel, icon: iconForCoreHref(child.to) }
        }
        const smsSentinel = smsHrefToSentinel(child.to, smsOrigin)
        if (isSmsNavSentinel(smsSentinel)) {
          return { ...child, to: smsSentinel, icon: iconForCoreHref(child.to) }
        }
        return child
      }),
    }
  })
}

function toNavConfigItems(
  defs: ResolvedCoreNavDef[],
  emailOrigin: string,
  smsOrigin: string,
): NavConfigItem[] {
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

  return rewritePeerLinksForIdentityNav(items, emailOrigin, smsOrigin)
}

export function buildStandaloneNav({ isSuperAdmin }: { isSuperAdmin: boolean } = { isSuperAdmin: false }): NavConfigItem[] {
  if (!isSuperAdmin) {
    return standaloneNav
  }
  return [...standaloneNav, { type: 'item', to: '/users', label: 'Users', icon: Users }]
}

const DEFAULT_EMAIL_ORIGIN = 'http://localhost:3014'
const DEFAULT_SMS_ORIGIN = 'http://localhost:3016'

function getCoreExternalOrigins(): Partial<Record<ExternalServiceId, string>> {
  return {
    email: import.meta.env.VITE_EMAIL_ORIGIN ?? DEFAULT_EMAIL_ORIGIN,
    sms: import.meta.env.VITE_SMS_ORIGIN ?? DEFAULT_SMS_ORIGIN,
  }
}

export function buildCoreNav(
  returnUrl: string,
  variant: PlatformNavVariant = 'main',
  externalOrigins: Partial<Record<ExternalServiceId, string>> = getCoreExternalOrigins(),
): NavConfigItem[] {
  const origin = getCoreOriginFromReturnUrl(returnUrl)
  if (!origin) {
    return standaloneNav
  }

  const emailOrigin = externalOrigins.email ?? DEFAULT_EMAIL_ORIGIN
  const smsOrigin = externalOrigins.sms ?? DEFAULT_SMS_ORIGIN

  return toNavConfigItems(resolvePlatformNavUrls(origin, variant, externalOrigins), emailOrigin, smsOrigin)
}

export function buildCoreNavFromQuery(
  returnUrl: string,
  coreNavQuery: string | null,
  externalOrigins: Partial<Record<ExternalServiceId, string>> = getCoreExternalOrigins(),
): NavConfigItem[] {
  return buildCoreNav(returnUrl, parsePlatformNavVariant(coreNavQuery), externalOrigins)
}

export function isIdentityShellRoute(pathname: string): boolean {
  return (IDENTITY_SHELL_ROUTES as readonly string[]).includes(pathname)
}

export { isEmailNavSentinel, isSmsNavSentinel }
