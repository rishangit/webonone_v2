import { parseNavTarget } from '@webonone/platform-nav'

const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/features/dashboard/pages/DashboardPage'),
  '/tags': () => import('@/features/tags/pages/TagsPage'),
  '/units': () => import('@/features/units/pages/UnitsPage'),
  '/attributes': () => import('@/features/attributes/pages/AttributesPage'),
  '/products': () => import('@/features/products/pages/ProductsPage'),
  '/services': () => import('@/features/services/pages/ServicesPage'),
  '/spaces': () => import('@/features/spaces/pages/SpacesPage'),
}

export function prefetchRoutePath(pathname: string): void {
  const prefetch = ROUTE_PREFETCHERS[pathname]
  if (prefetch) {
    void prefetch()
  }
}

export function prefetchNavTarget(to: string): void {
  const { pathname } = parseNavTarget(to)
  prefetchRoutePath(pathname)
}
