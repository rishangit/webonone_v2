import { DATA_NAV_SENTINELS, isDataNavSentinel } from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

export function parseDataNavSentinelFromTarget(to: string): string | null {
  if (isDataNavSentinel(to)) {
    return to
  }

  try {
    const { pathname } = new URL(to)
    if (pathname === '/data/dashboard') {
      return DATA_NAV_SENTINELS.dashboard
    }
    if (pathname === '/data/tags') {
      return DATA_NAV_SENTINELS.tags
    }
  } catch {
    // Not an absolute peer URL — local routes are handled elsewhere.
  }

  return null
}

export function withDataNavActions(
  items: NavConfigItem[],
  onDataNavClick: (sentinel: string) => void,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item') {
      const sentinel = parseDataNavSentinelFromTarget(item.to)
      if (sentinel) {
        return { ...item, onClick: () => onDataNavClick(sentinel) }
      }
      return item
    }

    return {
      ...item,
      children: item.children.map((child) => {
        const sentinel = parseDataNavSentinelFromTarget(child.to)
        if (sentinel) {
          return { ...child, onClick: () => onDataNavClick(sentinel) }
        }
        return child
      }),
    }
  })
}
