import { parseNavTarget } from '@webonone/platform-nav'

import {
  isDataNavSentinel,
  isEmailNavSentinel,
  isIdentityNavSentinel,
  isProfileNavSentinel,
  isSmsNavSentinel,
} from '@/features/shell/config/navItems'

const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/features/home/pages/HomePage'),
  '/calendar': () => import('@/features/calendar/pages/CalendarPage'),
  '/companies': () => import('@/features/settings/basic/pages/CompaniesPage'),
  '/staff': () => import('@/features/staff/pages/StaffPage'),
  '/settings/companies': () => import('@/features/settings/companies/pages/AllCompaniesPage'),
  '/settings/basic': () => import('@/features/settings/basic/pages/BasicSettingsPage'),
  '/settings/system-theme': () =>
    import('@/features/settings/system-theme/pages/SystemThemePage'),
}

function prefetchThemeDetail(): void {
  void import('@/features/settings/system-theme/pages/ThemeDetailPage')
}

function prefetchPlatformPeerFrame(): void {
  void import('@/features/shell/pages/PlatformPeerFrame')
}

function prefetchCompanyProfile(): void {
  void import('@/features/settings/companies/pages/CompanyProfilePage')
}

export function prefetchRoutePath(pathname: string): void {
  const prefetch = ROUTE_PREFETCHERS[pathname]
  if (prefetch) {
    void prefetch()
    return
  }

  if (
    pathname.startsWith('/settings/companies/') ||
    /^\/companies\/[^/]+$/.test(pathname)
  ) {
    prefetchCompanyProfile()
    return
  }

  if (/^\/settings\/system-theme\/[^/]+$/.test(pathname)) {
    prefetchThemeDetail()
    return
  }

  if (
    isEmailNavSentinel(pathname) ||
    isSmsNavSentinel(pathname) ||
    isIdentityNavSentinel(pathname) ||
    isProfileNavSentinel(pathname)
  ) {
    prefetchPlatformPeerFrame()
    return
  }

  if (isDataNavSentinel(pathname) || pathname.startsWith('/data/')) {
    void import('@/features/company-catalog/pages/DataCatalogRoutes')
    prefetchPlatformPeerFrame()
  }
}

export function prefetchNavTarget(to: string): void {
  const { pathname } = parseNavTarget(to)
  prefetchRoutePath(pathname)
}
