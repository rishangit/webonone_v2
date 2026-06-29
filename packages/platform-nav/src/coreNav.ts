export type PlatformNavVariant = 'main' | 'superAdmin'

export type ExternalServiceId = 'email'

export type CoreNavLeaf = {
  kind: 'item'
  path: string
  label: string
  externalService?: ExternalServiceId
  /** Path on the external service origin (default `/`). */
  externalPath?: string
}

export type CoreNavGroup = {
  kind: 'group'
  label: string
  children: CoreNavLeaf[]
}

export type CoreNavDef = CoreNavLeaf | CoreNavGroup

export type ResolvedCoreNavLeaf = {
  kind: 'item'
  href: string
  label: string
}

export type ResolvedCoreNavGroup = {
  kind: 'group'
  label: string
  children: ResolvedCoreNavLeaf[]
}

export type ResolvedCoreNavDef = ResolvedCoreNavLeaf | ResolvedCoreNavGroup

/** Internal sentinels for Email sub-nav in consumer AppLayouts (not routed on core origin). */
export const EMAIL_NAV_SENTINELS = {
  history: '/email/history',
  templates: '/email/templates',
} as const

export function isEmailNavSentinel(to: string): boolean {
  return to === EMAIL_NAV_SENTINELS.history || to === EMAIL_NAV_SENTINELS.templates
}

export function emailSentinelToExternalPath(sentinel: string): string | null {
  switch (sentinel) {
    case EMAIL_NAV_SENTINELS.history:
      return '/history'
    case EMAIL_NAV_SENTINELS.templates:
      return '/templates'
    default:
      return null
  }
}

export const MAIN_PLATFORM_NAV: CoreNavDef[] = [
  { kind: 'item', path: '/', label: 'Home' },
  {
    kind: 'group',
    label: 'Email',
    children: [
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.history,
        label: 'Email History',
        externalService: 'email',
        externalPath: '/history',
      },
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.templates,
        label: 'Templates',
        externalService: 'email',
        externalPath: '/templates',
      },
    ],
  },
  {
    kind: 'group',
    label: 'Settings',
    children: [
      { kind: 'item', path: '/settings/basic', label: 'Basic Settings' },
      { kind: 'item', path: '/settings/system-theme', label: 'System Theme' },
    ],
  },
]

export const SUPER_ADMIN_PLATFORM_NAV: CoreNavDef[] = [
  { kind: 'item', path: '/', label: 'Home' },
  { kind: 'item', path: '/companies', label: 'Companies' },
  {
    kind: 'group',
    label: 'Email',
    children: [
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.history,
        label: 'Email History',
        externalService: 'email',
        externalPath: '/history',
      },
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.templates,
        label: 'Templates',
        externalService: 'email',
        externalPath: '/templates',
      },
    ],
  },
  {
    kind: 'group',
    label: 'Settings',
    children: [
      { kind: 'item', path: '/settings/basic', label: 'Basic Settings' },
      { kind: 'item', path: '/settings/system-theme', label: 'System Theme' },
    ],
  },
]

export const CORE_NAV_QUERY_PARAM = 'core_nav' as const

export const CORE_NAV_VARIANT_MAIN = 'main' as const
export const CORE_NAV_VARIANT_SUPER_ADMIN = 'super_admin' as const

export function getPlatformNavDefs(variant: PlatformNavVariant): CoreNavDef[] {
  return variant === 'superAdmin' ? SUPER_ADMIN_PLATFORM_NAV : MAIN_PLATFORM_NAV
}

export function parsePlatformNavVariant(
  value: string | null | undefined,
): PlatformNavVariant {
  return value === CORE_NAV_VARIANT_SUPER_ADMIN ? 'superAdmin' : 'main'
}

export function toCoreNavQueryValue(variant: PlatformNavVariant): string {
  return variant === 'superAdmin' ? CORE_NAV_VARIANT_SUPER_ADMIN : CORE_NAV_VARIANT_MAIN
}

export function getCoreOriginFromReturnUrl(returnUrl: string): string | null {
  try {
    return new URL(returnUrl).origin
  } catch {
    return null
  }
}

function resolvePath(origin: string, path: string): string {
  if (path === '/') {
    return `${origin}/`
  }
  return `${origin}${path}`
}

function resolveLeafHref(
  origin: string,
  item: CoreNavLeaf,
  externalOrigins?: Partial<Record<ExternalServiceId, string>>,
): string {
  if (item.externalService) {
    const serviceOrigin = externalOrigins?.[item.externalService]
    if (serviceOrigin) {
      const base = serviceOrigin.replace(/\/$/, '')
      const subPath = item.externalPath ?? '/'
      if (subPath === '/') {
        return `${base}/`
      }
      return `${base}${subPath.startsWith('/') ? subPath : `/${subPath}`}`
    }
  }
  return resolvePath(origin, item.path)
}

export function resolvePlatformNavUrls(
  origin: string,
  variant: PlatformNavVariant,
  externalOrigins?: Partial<Record<ExternalServiceId, string>>,
): ResolvedCoreNavDef[] {
  return getPlatformNavDefs(variant).map((item) => {
    if (item.kind === 'item') {
      return {
        kind: 'item',
        href: resolveLeafHref(origin, item, externalOrigins),
        label: item.label,
      }
    }

    return {
      kind: 'group',
      label: item.label,
      children: item.children.map((child) => ({
        kind: 'item' as const,
        href: resolveLeafHref(origin, child, externalOrigins),
        label: child.label,
      })),
    }
  })
}
