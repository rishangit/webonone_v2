export type NavTarget = {
  pathname: string
  search: string
}

export type NavItemNavigateHandler = (to: NavTarget) => void

export function parseNavTarget(to: string): NavTarget {
  const queryIndex = to.indexOf('?')
  if (queryIndex === -1) {
    return { pathname: to, search: '' }
  }
  return {
    pathname: to.slice(0, queryIndex),
    search: to.slice(queryIndex + 1),
  }
}

export function createNavItemNavigate(navigate: NavItemNavigateHandler): (to: string) => void {
  return (to: string) => {
    const target = parseNavTarget(to)
    navigate(target)
  }
}
