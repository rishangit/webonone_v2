import { parseNavTarget } from '@webonone/platform-nav'

const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/features/dashboard/pages/DashboardPage'),
  '/invoices': () => import('@/features/invoices/pages/InvoicesPage'),
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
