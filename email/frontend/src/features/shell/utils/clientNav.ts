import type { NavigateFunction } from 'react-router-dom'
import type { NavConfigItem } from '@webonone/ui-kit'

function isLocalEmailPath(to: string): boolean {
  return to.startsWith('/') && !to.startsWith('//')
}

function parseNavTarget(to: string): { pathname: string; search: string } {
  const queryIndex = to.indexOf('?')
  if (queryIndex === -1) {
    return { pathname: to, search: '' }
  }
  return {
    pathname: to.slice(0, queryIndex),
    search: to.slice(queryIndex + 1),
  }
}

function hasNavOnClick(item: { to: string }): item is { to: string; onClick: () => void } {
  return 'onClick' in item && typeof (item as { onClick?: unknown }).onClick === 'function'
}

function attachLocalNavigation(items: NavConfigItem[], navigate: NavigateFunction): NavConfigItem[] {
  return items.map((item) => {
    if (item.type === 'group') {
      return {
        ...item,
        children: item.children.map((child) => {
          if (!isLocalEmailPath(child.to) || hasNavOnClick(child)) {
            return child
          }
          const target = parseNavTarget(child.to)
          return {
            ...child,
            onClick: () => navigate(target),
          }
        }),
      }
    }

    if (!isLocalEmailPath(item.to) || hasNavOnClick(item)) {
      return item
    }

    const target = parseNavTarget(item.to)
    return {
      ...item,
      onClick: () => navigate(target),
    }
  })
}

export function withClientSideNavigation(
  items: NavConfigItem[],
  navigate: NavigateFunction,
): NavConfigItem[] {
  return attachLocalNavigation(items, navigate)
}
