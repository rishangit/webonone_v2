import { EMAIL_NAV_SENTINELS, isEmailNavSentinel } from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

export function parseEmailNavSentinelFromTarget(to: string): string | null {
  if (isEmailNavSentinel(to)) {
    return to
  }

  try {
    const { pathname } = new URL(to)
    if (pathname === '/email/history') {
      return EMAIL_NAV_SENTINELS.history
    }
    if (pathname === '/email/templates') {
      return EMAIL_NAV_SENTINELS.templates
    }
  } catch {
    // Not an absolute peer URL — local routes are handled elsewhere.
  }

  return null
}

export function withEmailNavActions(
  items: NavConfigItem[],
  onEmailNavClick: (sentinel: string) => void,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item') {
      const sentinel = parseEmailNavSentinelFromTarget(item.to)
      if (sentinel) {
        return { ...item, onClick: () => onEmailNavClick(sentinel) }
      }
      return item
    }

    return {
      ...item,
      children: item.children.map((child) => {
        const sentinel = parseEmailNavSentinelFromTarget(child.to)
        if (sentinel) {
          return { ...child, onClick: () => onEmailNavClick(sentinel) }
        }
        return child
      }),
    }
  })
}
