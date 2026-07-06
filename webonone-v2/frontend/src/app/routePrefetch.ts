import { parseNavTarget } from '@webonone/platform-nav'

import { isDataNavSentinel, isEmailNavSentinel, isProfileNavSentinel } from '@/features/shell/config/navItems'



const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {

  '/': () => import('@/features/home/pages/HomePage'),

  '/companies': () => import('@/features/settings/basic/pages/CompaniesPage'),

  '/settings/basic': () => import('@/features/settings/basic/pages/BasicSettingsPage'),

  '/settings/system-theme': () => import('@/features/settings/system-theme/pages/SystemThemePage'),

}



function prefetchPlatformPeerFrame(): void {

  void import('@/features/shell/pages/PlatformPeerFrame')

}



export function prefetchRoutePath(pathname: string): void {

  const prefetch = ROUTE_PREFETCHERS[pathname]

  if (prefetch) {

    void prefetch()

    return

  }



  if (isEmailNavSentinel(pathname) || isDataNavSentinel(pathname) || isProfileNavSentinel(pathname)) {

    prefetchPlatformPeerFrame()

  }

}



export function prefetchNavTarget(to: string): void {

  const { pathname } = parseNavTarget(to)

  prefetchRoutePath(pathname)

}


