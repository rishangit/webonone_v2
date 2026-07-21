import {
  Building2,
  Database,
  Home,
  Layers,
  Package,
  Palette,
  Ruler,
  Settings,
  Shapes,
  Tag,
  Wrench,
} from 'lucide-react'
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
  '/tags': Tag,
  '/units': Ruler,
  '/attributes': Shapes,
  '/products': Package,
  '/services': Wrench,
  '/spaces': Layers,
  '/settings/basic': Building2,
  '/settings/system-theme': Palette,
}

const CORE_GROUP_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Settings,
  Data: Database,
  Email: Database,
  SMS: Database,
}

function iconForCoreHref(href: string): LucideIcon {
  try {
    const path = new URL(href).pathname
    return CORE_ICON_BY_PATH_SUFFIX[path] ?? Home
  } catch {
    return Home
  }
}

function rewriteDataOriginLinks(items: NavConfigItem[], dataOrigin: string): NavConfigItem[] {
  const normalizedOrigin = dataOrigin.replace(/\/$/, '')

  function rewriteTo(to: string): string {
    if (to === normalizedOrigin || to === `${normalizedOrigin}/`) {
      return '/'
    }
    if (to.startsWith(`${normalizedOrigin}/`)) {
      return to.slice(normalizedOrigin.length)
    }
    return to
  }

  return items.map((item) => {
    if (item.type === 'item') {
      return { ...item, to: rewriteTo(item.to) }
    }

    return {
      ...item,
      icon: CORE_GROUP_ICON_BY_LABEL[item.label] ?? item.icon,
      children: item.children.map((child) => ({
        ...child,
        to: rewriteTo(child.to),
      })),
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
  dataOrigin: string = window.location.origin,
): NavConfigItem[] {
  const origin = getCoreOriginFromReturnUrl(returnUrl)
  if (!origin) {
    return []
  }

  const items = toNavConfigItems(
    resolvePlatformNavUrls(origin, variant, { data: dataOrigin }),
  )
  return rewriteDataOriginLinks(items, dataOrigin)
}

export function buildCoreNavFromQuery(
  returnUrl: string,
  coreNavQuery: string | null,
  dataOrigin: string = window.location.origin,
): NavConfigItem[] {
  return buildCoreNav(returnUrl, parsePlatformNavVariant(coreNavQuery), dataOrigin)
}
