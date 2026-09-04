/** DNS labels reserved for platform hosts — never assign to a company site. */
export const RESERVED_COMPANY_WEB_SLUGS = new Set([
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
  'ftp',
  'ns',
  'mx',
  'smtp',
  'auth',
  'login',
  'cdn',
  'static',
  'assets',
  'files',
  'docs',
  'help',
  'blog',
  'status',
  'account',
  'accounts',
  'profile',
  'dashboard',
  'localhost',
  'webonone',
  'staging',
  'preview',
  'test',
  'kit',
  'ui',
  'mobile',
])

const SLUG_MAX = 63

export function slugifyCompanyName(name: string): string {
  let slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '')

  if (!slug) slug = 'company'
  if (!/^[a-z]/.test(slug)) {
    slug = `c-${slug}`.slice(0, SLUG_MAX).replace(/-+$/g, '')
  }
  if (RESERVED_COMPANY_WEB_SLUGS.has(slug)) {
    slug = `${slug}-co`.slice(0, SLUG_MAX).replace(/-+$/g, '')
  }
  return slug
}

export async function allocateUniqueCompanyWebSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyCompanyName(name)
  if (!(await isTaken(base))) return base
  for (let n = 2; n < 10_000; n += 1) {
    const suffix = `-${n}`
    const candidate = `${base.slice(0, SLUG_MAX - suffix.length)}${suffix}`
    if (!(await isTaken(candidate))) return candidate
  }
  throw new Error('Unable to allocate a unique company web slug')
}

export function isCompanyWebSlug(value: string): boolean {
  return /^[a-z][a-z0-9-]{0,62}$/.test(value) && !value.includes('--') && !value.endsWith('-')
}

export function companyWebUrl(webSlug: string, siteHost: string): string {
  return `https://${webSlug}.${siteHost.replace(/^www\./i, '')}`
}
