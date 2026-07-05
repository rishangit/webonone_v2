import { parseNavTarget } from '@webonone/platform-nav'

const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/features/dashboard/pages/DashboardPage'),
  '/send': () => import('@/features/send/pages/SendPage'),
  '/templates': () => import('@/features/templates/pages/TemplatesPage'),
  '/history': () => import('@/features/history/pages/HistoryPage'),
  '/queue': () => import('@/features/queue/pages/QueuePage'),
  '/test': () => import('@/features/test/pages/TestPage'),
  '/providers': () => import('@/features/providers/pages/ProvidersPage'),
  '/settings': () => import('@/features/settings/pages/SettingsPage'),
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
