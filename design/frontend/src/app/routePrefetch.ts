import { parseNavTarget } from '@webonone/platform-nav'

const ROUTE_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  '/forms': () => import('@/features/forms/pages/FormsPage'),
  '/website': () => import('@/features/website/pages/WebsitePagesPage'),
  '/website/pages': () => import('@/features/website/pages/WebsitePagesPage'),
}

export function prefetchRoutePath(pathname: string): void {
  const prefetch = ROUTE_PREFETCHERS[pathname]
  if (prefetch) {
    void prefetch()
  }
  if (pathname.startsWith('/forms/') && pathname.endsWith('/edit')) {
    void import('@/features/forms/pages/FormDesignerPage')
  }
  if (
    pathname.startsWith('/website/') &&
    (pathname.endsWith('/edit') || pathname.startsWith('/website/themes/'))
  ) {
    if (pathname.includes('/themes/')) {
      void import('@/features/website/pages/WebsiteThemeEditorPage')
    } else {
      void import('@/features/website/pages/WebsiteDesignerPage')
    }
  }
}

export function prefetchNavTarget(to: string): void {
  const { pathname } = parseNavTarget(to)
  prefetchRoutePath(pathname)
}
