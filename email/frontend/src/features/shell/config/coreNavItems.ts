import { Building2, Home, Mail, Palette, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  getCoreOriginFromReturnUrl,
  parsePlatformNavVariant,
  resolvePlatformNavUrls,
  type PlatformNavVariant,
  type ResolvedCoreNavDef,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

const CORE_ICON_BY_PATH_SUFFIX: Record<string, LucideIcon> = {
  '/': Home,
  '/companies': Building2,
  '/email': Mail,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const CORE_GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings,
}

function iconForCoreHref(href: string): LucideIcon {
  try {
    const path = new URL(href).pathname
    return CORE_ICON_BY_PATH_SUFFIX[path] ?? Home
  } catch {
    return Home
  }
}

function rewriteEmailOriginLinks(items: NavConfigItem[], emailOrigin: string): NavConfigItem[] {
  const normalizedOrigin = emailOrigin.replace(/\/$/, '')

  return items.map((item) => {
    if (item.type === 'item') {
      if (item.to === normalizedOrigin || item.to === `${normalizedOrigin}/`) {
        return { ...item, to: '/' }
      }
      return item
    }

    return {
      ...item,
      children: item.children.map((child) =>
        child.to === normalizedOrigin || child.to === `${normalizedOrigin}/`
          ? { ...child, to: '/' }
          : child,
      ),
    }
  })
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

export function buildCoreNav(
  returnUrl: string,
  variant: PlatformNavVariant = 'main',
  emailOrigin: string = window.location.origin,
): NavConfigItem[] {
  const origin = getCoreOriginFromReturnUrl(returnUrl)
  if (!origin) {
    return []
  }

  const items = toNavConfigItems(
    resolvePlatformNavUrls(origin, variant, { email: emailOrigin }),
  )
  return rewriteEmailOriginLinks(items, emailOrigin)
}

export function buildCoreNavFromQuery(
  returnUrl: string,
  coreNavQuery: string | null,
  emailOrigin: string = window.location.origin,
): NavConfigItem[] {
  return buildCoreNav(returnUrl, parsePlatformNavVariant(coreNavQuery), emailOrigin)
}
