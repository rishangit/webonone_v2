export type PlatformNavVariant = 'main' | 'superAdmin' | 'member'

export type ExternalServiceId = 'email' | 'data' | 'identity' | 'sms' | 'payment' | 'design'

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
  send: '/email/send',
  queue: '/email/queue',
  history: '/email/history',
  templates: '/email/templates',
} as const

export function isEmailNavSentinel(to: string): boolean {
  if (
    to === EMAIL_NAV_SENTINELS.send ||
    to === EMAIL_NAV_SENTINELS.queue ||
    to === EMAIL_NAV_SENTINELS.history ||
    to === EMAIL_NAV_SENTINELS.templates
  ) {
    return true
  }
  // Nested template routes: /email/templates/:id[/preview|versions]
  if (to.startsWith(`${EMAIL_NAV_SENTINELS.templates}/`)) {
    const rest = to.slice(`${EMAIL_NAV_SENTINELS.templates}/`.length)
    return Boolean(rest) && !rest.includes('..')
  }
  return false
}

export function emailSentinelToExternalPath(sentinel: string): string | null {
  switch (sentinel) {
    case EMAIL_NAV_SENTINELS.send:
      return '/send'
    case EMAIL_NAV_SENTINELS.queue:
      return '/queue'
    case EMAIL_NAV_SENTINELS.history:
      return '/history'
    case EMAIL_NAV_SENTINELS.templates:
      return '/templates'
    default:
      break
  }
  if (sentinel.startsWith(`${EMAIL_NAV_SENTINELS.templates}/`)) {
    const rest = sentinel.slice(EMAIL_NAV_SENTINELS.templates.length)
    if (!rest || rest.includes('..')) return null
    return `/templates${rest}`
  }
  return null
}

/** Internal sentinels for Data sub-nav in consumer AppLayouts (not routed on core origin). */
export const DATA_NAV_SENTINELS = {
  tags: '/data/tags',
  units: '/data/units',
  attributes: '/data/attributes',
  products: '/data/products',
  services: '/data/services',
  spaces: '/data/spaces',
} as const

export const DATA_ENTITY_KEYS = [
  'tags',
  'units',
  'attributes',
  'products',
  'services',
  'spaces',
] as const

export type DataEntityKey = (typeof DATA_ENTITY_KEYS)[number]

/** Catalog sections a company can enable under Data (company profile + company_admin nav). */
export const COMPANY_DATA_ENTITY_KEYS = ['products', 'services', 'spaces'] as const

export type CompanyDataEntityKey = (typeof COMPANY_DATA_ENTITY_KEYS)[number]

export const DATA_ENTITY_LABELS: Record<DataEntityKey, string> = {
  tags: 'Tags',
  units: 'Units',
  attributes: 'Attributes',
  products: 'Products',
  services: 'Services',
  spaces: 'Spaces',
}

export function isDataEntityKey(value: string): value is DataEntityKey {
  return (DATA_ENTITY_KEYS as readonly string[]).includes(value)
}

export function isCompanyDataEntityKey(value: string): value is CompanyDataEntityKey {
  return (COMPANY_DATA_ENTITY_KEYS as readonly string[]).includes(value)
}

export function filterCompanyDataEntities(
  keys: readonly DataEntityKey[],
): CompanyDataEntityKey[] {
  return COMPANY_DATA_ENTITY_KEYS.filter((key) => keys.includes(key))
}

export function dataEntityKeyFromSentinel(path: string): DataEntityKey | null {
  switch (path) {
    case DATA_NAV_SENTINELS.tags:
      return 'tags'
    case DATA_NAV_SENTINELS.units:
      return 'units'
    case DATA_NAV_SENTINELS.attributes:
      return 'attributes'
    case DATA_NAV_SENTINELS.products:
      return 'products'
    case DATA_NAV_SENTINELS.services:
      return 'services'
    case DATA_NAV_SENTINELS.spaces:
      return 'spaces'
    default:
      return null
  }
}

/**
 * For company_admin nav: keep only enabled Data children; drop the Data group when empty.
 * Other groups/items are unchanged.
 */
export function filterPlatformNavDataEntities(
  defs: CoreNavDef[],
  enabledKeys: readonly DataEntityKey[],
): CoreNavDef[] {
  const enabled = new Set(enabledKeys)
  return defs.flatMap((item) => {
    if (item.kind !== 'group' || item.label !== 'Data') {
      return [item]
    }
    const children = item.children.filter((child) => {
      const key = dataEntityKeyFromSentinel(child.path)
      return key !== null && enabled.has(key)
    })
    if (children.length === 0) {
      return []
    }
    return [{ ...item, children }]
  })
}

export function isDataNavSentinel(to: string): boolean {
  return (
    to === DATA_NAV_SENTINELS.tags ||
    to === DATA_NAV_SENTINELS.units ||
    to === DATA_NAV_SENTINELS.attributes ||
    to === DATA_NAV_SENTINELS.products ||
    to === DATA_NAV_SENTINELS.services ||
    to === DATA_NAV_SENTINELS.spaces
  )
}

export function dataSentinelToExternalPath(sentinel: string): string | null {
  switch (sentinel) {
    case DATA_NAV_SENTINELS.tags:
      return '/tags'
    case DATA_NAV_SENTINELS.units:
      return '/units'
    case DATA_NAV_SENTINELS.attributes:
      return '/attributes'
    case DATA_NAV_SENTINELS.products:
      return '/products'
    case DATA_NAV_SENTINELS.services:
      return '/services'
    case DATA_NAV_SENTINELS.spaces:
      return '/spaces'
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
  if (to === IDENTITY_NAV_SENTINELS.users) return true
  if (!to.startsWith(`${IDENTITY_NAV_SENTINELS.users}/`)) return false
  const userId = to.slice(`${IDENTITY_NAV_SENTINELS.users}/`.length)
  return Boolean(userId) && !userId.includes('/') && !userId.includes('..')
}

export function identitySentinelToExternalPath(sentinel: string): string | null {
  if (sentinel === IDENTITY_NAV_SENTINELS.users) {
    return '/users'
  }
  if (sentinel.startsWith(`${IDENTITY_NAV_SENTINELS.users}/`)) {
    const userId = sentinel.slice(`${IDENTITY_NAV_SENTINELS.users}/`.length)
    if (!userId || userId.includes('/') || userId.includes('..')) {
      return null
    }
    return `/users/${userId}`
  }
  return null
}

/** Internal sentinels for SMS sub-nav in consumer AppLayouts (not routed on core origin). */
export const SMS_NAV_SENTINELS = {
  send: '/sms/send',
  devices: '/sms/devices',
  queue: '/sms/queue',
  history: '/sms/history',
  templates: '/sms/templates',
} as const

export function isSmsNavSentinel(to: string): boolean {
  if (
    to === SMS_NAV_SENTINELS.send ||
    to === SMS_NAV_SENTINELS.devices ||
    to === SMS_NAV_SENTINELS.queue ||
    to === SMS_NAV_SENTINELS.history ||
    to === SMS_NAV_SENTINELS.templates
  ) {
    return true
  }
  // Nested template routes: /sms/templates/:id[/preview|versions]
  if (to.startsWith(`${SMS_NAV_SENTINELS.templates}/`)) {
    const rest = to.slice(`${SMS_NAV_SENTINELS.templates}/`.length)
    return Boolean(rest) && !rest.includes('..')
  }
  return false
}

export function smsSentinelToExternalPath(sentinel: string): string | null {
  switch (sentinel) {
    case SMS_NAV_SENTINELS.send:
      return '/send'
    case SMS_NAV_SENTINELS.devices:
      return '/devices'
    case SMS_NAV_SENTINELS.queue:
      return '/queue'
    case SMS_NAV_SENTINELS.history:
      return '/history'
    case SMS_NAV_SENTINELS.templates:
      return '/templates'
    default:
      break
  }
  if (sentinel.startsWith(`${SMS_NAV_SENTINELS.templates}/`)) {
    const rest = sentinel.slice(SMS_NAV_SENTINELS.templates.length)
    if (!rest || rest.includes('..')) return null
    return `/templates${rest}`
  }
  return null
}

const SMS_PLATFORM_NAV_GROUP: CoreNavGroup = {
  kind: 'group',
  label: 'SMS',
  children: [
    {
      kind: 'item',
      path: SMS_NAV_SENTINELS.send,
      label: 'Send SMS',
      externalService: 'sms',
      externalPath: '/send',
    },
    {
      kind: 'item',
      path: SMS_NAV_SENTINELS.devices,
      label: 'Devices',
      externalService: 'sms',
      externalPath: '/devices',
    },
    {
      kind: 'item',
      path: SMS_NAV_SENTINELS.queue,
      label: 'Queue',
      externalService: 'sms',
      externalPath: '/queue',
    },
    {
      kind: 'item',
      path: SMS_NAV_SENTINELS.history,
      label: 'History',
      externalService: 'sms',
      externalPath: '/history',
    },
    {
      kind: 'item',
      path: SMS_NAV_SENTINELS.templates,
      label: 'Templates',
      externalService: 'sms',
      externalPath: '/templates',
    },
  ],
}

/** Internal sentinels for Payment sub-nav in consumer AppLayouts (not routed on core origin). */
export const PAYMENT_NAV_SENTINELS = {
  invoices: '/payment/invoices',
} as const

export function isPaymentNavSentinel(to: string): boolean {
  return to === PAYMENT_NAV_SENTINELS.invoices
}

export function paymentSentinelToExternalPath(sentinel: string): string | null {
  switch (sentinel) {
    case PAYMENT_NAV_SENTINELS.invoices:
      return '/invoices'
    default:
      return null
  }
}

const PAYMENT_PLATFORM_NAV_GROUP: CoreNavGroup = {
  kind: 'group',
  label: 'Payment',
  children: [
    {
      kind: 'item',
      path: PAYMENT_NAV_SENTINELS.invoices,
      label: 'Invoices',
      externalService: 'payment',
      externalPath: '/invoices',
    },
  ],
}

/** Internal sentinels for Design sub-nav in consumer AppLayouts (not routed on core origin). */
export const DESIGN_NAV_SENTINELS = {
  forms: '/design/forms',
} as const

export function isDesignNavSentinel(to: string): boolean {
  if (to === DESIGN_NAV_SENTINELS.forms) return true
  if (to.startsWith(`${DESIGN_NAV_SENTINELS.forms}/`)) {
    const rest = to.slice(`${DESIGN_NAV_SENTINELS.forms}/`.length)
    return Boolean(rest) && !rest.includes('..')
  }
  return false
}

export function designSentinelToExternalPath(sentinel: string): string | null {
  if (sentinel === DESIGN_NAV_SENTINELS.forms) return '/forms'
  if (sentinel.startsWith(`${DESIGN_NAV_SENTINELS.forms}/`)) {
    const rest = sentinel.slice(DESIGN_NAV_SENTINELS.forms.length)
    if (!rest || rest.includes('..')) return null
    return `/forms${rest}`
  }
  return null
}

const DESIGN_PLATFORM_NAV_GROUP: CoreNavGroup = {
  kind: 'group',
  label: 'Design',
  children: [
    {
      kind: 'item',
      path: DESIGN_NAV_SENTINELS.forms,
      label: 'Forms',
      externalService: 'design',
      externalPath: '/forms',
    },
  ],
}

const DATA_PLATFORM_NAV_GROUP: CoreNavGroup = {
  kind: 'group',
  label: 'Data',
  children: [
    {
      kind: 'item',
      path: DATA_NAV_SENTINELS.tags,
      label: 'Tags',
      externalService: 'data',
      externalPath: '/tags',
    },
    {
      kind: 'item',
      path: DATA_NAV_SENTINELS.units,
      label: 'Units',
      externalService: 'data',
      externalPath: '/units',
    },
    {
      kind: 'item',
      path: DATA_NAV_SENTINELS.attributes,
      label: 'Attributes',
      externalService: 'data',
      externalPath: '/attributes',
    },
    {
      kind: 'item',
      path: DATA_NAV_SENTINELS.products,
      label: 'Products',
      externalService: 'data',
      externalPath: '/products',
    },
    {
      kind: 'item',
      path: DATA_NAV_SENTINELS.services,
      label: 'Services',
      externalService: 'data',
      externalPath: '/services',
    },
    {
      kind: 'item',
      path: DATA_NAV_SENTINELS.spaces,
      label: 'Spaces',
      externalService: 'data',
      externalPath: '/spaces',
    },
  ],
}

const CALENDAR_PLATFORM_NAV_GROUP: CoreNavGroup = {
  kind: 'group',
  label: 'Calendar',
  children: [
    { kind: 'item', path: '/calendar/schedule', label: 'Schedule' },
    { kind: 'item', path: '/calendar/events', label: 'Events' },
  ],
}

const IDENTITY_COMPANY_NAV_GROUP: CoreNavGroup = {
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
    { kind: 'item', path: '/staff', label: 'Staff' },
  ],
}

export const MAIN_PLATFORM_NAV: CoreNavDef[] = [
  { kind: 'item', path: '/', label: 'Home' },
  CALENDAR_PLATFORM_NAV_GROUP,
  IDENTITY_COMPANY_NAV_GROUP,
  DATA_PLATFORM_NAV_GROUP,
  {
    kind: 'group',
    label: 'Email',
    children: [
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.send,
        label: 'Send Email',
        externalService: 'email',
        externalPath: '/send',
      },
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.queue,
        label: 'Queue',
        externalService: 'email',
        externalPath: '/queue',
      },
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
  SMS_PLATFORM_NAV_GROUP,
  PAYMENT_PLATFORM_NAV_GROUP,
  DESIGN_PLATFORM_NAV_GROUP,
  {
    kind: 'group',
    label: 'Settings',
    children: [
      { kind: 'item', path: '/settings/companies', label: 'My Companies' },
      { kind: 'item', path: '/settings/basic', label: 'Basic Settings' },
      { kind: 'item', path: '/settings/system-theme', label: 'System Theme' },
    ],
  },
]

export const MEMBER_PLATFORM_NAV: CoreNavDef[] = [
  { kind: 'item', path: '/', label: 'Home' },
  CALENDAR_PLATFORM_NAV_GROUP,
  IDENTITY_COMPANY_NAV_GROUP,
  DATA_PLATFORM_NAV_GROUP,
  DESIGN_PLATFORM_NAV_GROUP,
  {
    kind: 'group',
    label: 'Settings',
    children: [
      { kind: 'item', path: '/settings/companies', label: 'My Companies' },
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
  DATA_PLATFORM_NAV_GROUP,
  {
    kind: 'group',
    label: 'Email',
    children: [
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.send,
        label: 'Send Email',
        externalService: 'email',
        externalPath: '/send',
      },
      {
        kind: 'item',
        path: EMAIL_NAV_SENTINELS.queue,
        label: 'Queue',
        externalService: 'email',
        externalPath: '/queue',
      },
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
  SMS_PLATFORM_NAV_GROUP,
  PAYMENT_PLATFORM_NAV_GROUP,
  {
    kind: 'group',
    label: 'Settings',
    children: [
      { kind: 'item', path: '/settings/companies', label: 'My Companies' },
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
