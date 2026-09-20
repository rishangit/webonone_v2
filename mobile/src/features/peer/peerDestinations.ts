import {
  designSentinelToExternalPath,
  isDesignNavSentinel,
} from '@webonone/platform-nav'
import { env } from '@/shared/config/env'

export type PeerDestination =
  | { kind: 'webview'; title: string; origin: string; path: string; storageKey: string }
  | { kind: 'browser'; title: string; url: string }

function titleFromPath(pathname: string): string {
  const leaf = pathname.split('/').filter(Boolean).pop() ?? pathname
  return leaf.replace(/-/g, ' ').replace(/^\w/, (ch) => ch.toUpperCase())
}

export function resolvePeerDestination(pathname: string): PeerDestination {
  if (isDesignNavSentinel(pathname) && !pathname.startsWith('/design/website')) {
    return {
      kind: 'webview',
      title: 'Design',
      origin: env.designOrigin,
      path: designSentinelToExternalPath(pathname) ?? '/forms',
      storageKey: 'design_auth',
    }
  }

  const url = `${env.webononeOrigin}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
  return { kind: 'browser', title: titleFromPath(pathname), url }
}
