import {
  isEmailNavSentinel,
  isSmsNavSentinel,
} from '@webonone/platform-nav'
import type { NavConfigItem } from '@webonone/ui-kit'

export function parseEmailNavSentinelFromTarget(to: string): string | null {
  if (isEmailNavSentinel(to)) {
    return to
  }

  try {
    const { pathname } = new URL(to)
    if (isEmailNavSentinel(pathname)) {
      return pathname
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

export function parseSmsNavSentinelFromTarget(to: string): string | null {
  if (isSmsNavSentinel(to)) {
    return to
  }

  try {
    const { pathname } = new URL(to)
    if (isSmsNavSentinel(pathname)) {
      return pathname
    }
  } catch {
    // Not an absolute peer URL — local routes are handled elsewhere.
  }

  return null
}

export function withSmsNavActions(
  items: NavConfigItem[],
  onSmsNavClick: (sentinel: string) => void,
): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'item') {
      const sentinel = parseSmsNavSentinelFromTarget(item.to)
      if (sentinel) {
        return { ...item, onClick: () => onSmsNavClick(sentinel) }
      }
      return item
    }

    return {
      ...item,
      children: item.children.map((child) => {
        const sentinel = parseSmsNavSentinelFromTarget(child.to)
        if (sentinel) {
          return { ...child, onClick: () => onSmsNavClick(sentinel) }
        }
        return child
      }),
    }
  })
}
