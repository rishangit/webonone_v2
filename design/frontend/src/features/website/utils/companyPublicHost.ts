const RESERVED_PUBLIC_HOST_SLUGS = new Set([
  'app',
  'identity',
  'media',
  'email',
  'data',
  'sms',
  'payment',
  'design',
  'ai',
  'support',
  'www',
  'website',
  'api',
  'admin',
  'mail',
  'cdn',
  'static',
  'assets',
  'files',
  'docs',
  'help',
  'blog',
  'status',
  'auth',
  'login',
  'account',
  'accounts',
  'profile',
  'dashboard',
  'localhost',
  'webonone',
  'staging',
  'live',
  'preview',
  'test',
  'kit',
  'ui',
  'mobile',
])

export function getCompanySiteHost(): string {
  const configured = import.meta.env.VITE_COMPANY_SITE_HOST?.trim()
  if (configured) {
    return configured.replace(/^www\./i, '').replace(/^https?:\/\//, '')
  }
  return 'live.webonone.com'
}

/** When the SPA is served on `{slug}.webonone.com`, return that slug. */
export function getCompanyPublicHostSlug(): string | null {
  if (typeof window === 'undefined') return null
  const host = window.location.hostname.toLowerCase()
  const siteHost = getCompanySiteHost().toLowerCase()
  if (!host.endsWith(`.${siteHost}`)) return null
  const subdomain = host.slice(0, -(siteHost.length + 1))
  if (!subdomain || subdomain.includes('.')) return null
  if (RESERVED_PUBLIC_HOST_SLUGS.has(subdomain)) return null
  return subdomain
}

export function publicPageHref(companyKey: string, path: string): string {
  const suffix = path ? `/${path}` : ''
  if (getCompanyPublicHostSlug()) return suffix || '/'
  return `/s/${companyKey}${suffix}`
}
