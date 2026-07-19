export type PlatformNavVariant = 'main' | 'superAdmin' | 'member'

export type ExternalServiceId = 'email' | 'data' | 'identity'

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

/** Internal sentinels for Data sub-nav in consumer AppLayouts (not routed on core origin). */
export const DATA_NAV_SENTINELS = {
  dashboard: '/data/dashboard',
  tags: '/data/tags',
} as const

export function isDataNavSentinel(to: string): boolean {
  return to === DATA_NAV_SENTINELS.dashboard || to === DATA_NAV_SENTINELS.tags
}

export function dataSentinelToExternalPath(sentinel: string): string | null {
  switch (sentinel) {
    case DATA_NAV_SENTINELS.dashboard:
      return '/'
    case DATA_NAV_SENTINELS.tags:
      return '/tags'
    default:
      return null
  }
}

/** Internal sentinel for Identity profile in consumer AppLayouts (not routed on core origin). */
export const PROFILE_NAV_SENTINEL = '/profile' as const

export function isProfileNavSentinel(to: string): boolean {
  return to === PROFILE_NAV_SENTINEL
}

export function profileSentinelToExternalPath(sentinel: string): string | null {
  if (sentinel === PROFILE_NAV_SENTINEL || sentinel.startsWith(`${PROFILE_NAV_SENTINEL}/`)) {
    const suffix = sentinel.slice(PROFILE_NAV_SENTINEL.length)
    return suffix ? `/profile${suffix}` : '/profile'
  }
  return null
}

/** Internal sentinels for Identity sub-nav in consumer AppLayouts (not routed on core origin). */
export const IDENTITY_NAV_SENTINELS = {
  users: '/identity/users',
} as const

export function isIdentityNavSentinel(to: string): boolean {
  return to === IDENTITY_NAV_SENTINELS.users
}

export function identitySentinelToExternalPath(sentinel: string): string | null {
  switch (sentinel) {
    case IDENTITY_NAV_SENTINELS.users:
      return '/users'
    default:
      return null
  }
}

export const MAIN_PLATFORM_NAV: CoreNavDef[] = [
  { kind: 'item', path: '/', label: 'Home' },
  {
    kind: 'group',
    label: 'Data',
    children: [
      {
        kind: 'item',
        path: DATA_NAV_SENTINELS.dashboard,
        label: 'Data Catalog',
        externalService: 'data',
        externalPath: '/',
      },
      {
        kind: 'item',
        path: DATA_NAV_SENTINELS.tags,
        label: 'Tags',
        externalService: 'data',
        externalPath: '/tags',
      },
    ],
  },
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

export const MEMBER_PLATFORM_NAV: CoreNavDef[] = [
  { kind: 'item', path: '/', label: 'Home' },
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
    label: 'Identity',
    children: [
      {
        kind: 'item',
        path: IDENTITY_NAV_SENTINELS.users,
        label: 'Users',
        externalService: 'identity',
        externalPath: '/users',
      },
    ],
  },
  {
    kind: 'group',
    label: 'Data',
    children: [
      {
        kind: 'item',
        path: DATA_NAV_SENTINELS.dashboard,
        label: 'Data Catalog',
        externalService: 'data',
        externalPath: '/',
      },
      {
        kind: 'item',
        path: DATA_NAV_SENTINELS.tags,
        label: 'Tags',
        externalService: 'data',
        externalPath: '/tags',
      },
    ],
  },
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
export const CORE_NAV_VARIANT_COMPANY_ADMIN = 'company_admin' as const
export const CORE_NAV_VARIANT_MEMBER = 'member' as const

export function getPlatformNavDefs(variant: PlatformNavVariant): CoreNavDef[] {
  if (variant === 'superAdmin') return SUPER_ADMIN_PLATFORM_NAV
  if (variant === 'member') return MEMBER_PLATFORM_NAV
  return MAIN_PLATFORM_NAV
}

export function parsePlatformNavVariant(
  value: string | null | undefined,
): PlatformNavVariant {
  if (value === CORE_NAV_VARIANT_SUPER_ADMIN) return 'superAdmin'
  if (value === CORE_NAV_VARIANT_MEMBER) return 'member'
  if (value === CORE_NAV_VARIANT_COMPANY_ADMIN || value === CORE_NAV_VARIANT_MAIN) return 'main'
  return 'main'
}

export function toCoreNavQueryValue(variant: PlatformNavVariant): string {
  if (variant === 'superAdmin') return CORE_NAV_VARIANT_SUPER_ADMIN
  if (variant === 'member') return CORE_NAV_VARIANT_MEMBER
  return CORE_NAV_VARIANT_COMPANY_ADMIN
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
