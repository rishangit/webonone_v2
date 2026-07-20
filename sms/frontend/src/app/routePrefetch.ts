import { parseNavTarget } from '@webonone/platform-nav'

const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/features/dashboard/pages/DashboardPage'),
  '/send': () => import('@/features/send/pages/SendPage'),
  '/devices': () => import('@/features/devices/pages/DevicesPage'),
  '/queue': () => import('@/features/queue/pages/QueuePage'),
  '/history': () => import('@/features/history/pages/HistoryPage'),
  '/templates': () => import('@/features/templates/pages/TemplatesPage'),
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
