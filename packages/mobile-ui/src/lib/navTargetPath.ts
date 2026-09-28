/** Pathname portion of a nav `to` value (strips `?query` from in-app routes). */
export function navTargetPath(to: string): string {
  const queryIndex = to.indexOf('?')
  if (queryIndex === -1) {
    return to
  }
  return to.slice(0, queryIndex)
}

function pathMatchesActive(activePath: string, target: string): boolean {
  if (target === '/') return activePath === '/'
  return activePath === target || activePath.startsWith(`${target}/`)
}

/**
 * Whether `to` should show as the active nav item for `activePath`.
 * Longest matching sibling wins (e.g. Events vs Schedule under Calendar).
 */
export function isNavPathActive(
  activePath: string | undefined,
  to: string,
  siblingTos?: readonly string[],
): boolean {
  if (!activePath) {
    return false
  }
  const target = navTargetPath(to)
  if (!pathMatchesActive(activePath, target)) {
    return false
  }

  if (!siblingTos || siblingTos.length === 0) {
    return true
  }

  let bestLength = -1
  for (const sibling of siblingTos) {
    const path = navTargetPath(sibling)
    if (pathMatchesActive(activePath, path) && path.length > bestLength) {
      bestLength = path.length
    }
  }

  return target.length === bestLength
}

export type MobileNavGroupLike = {
  type: 'group'
  label: string
  children: { to: string }[]
}

export function findActiveNavGroupLabel(
  nav: readonly { type: string; label: string; children?: { to: string }[] }[],
  activePath: string | undefined,
): string | null {
  if (!activePath) return null
  for (const item of nav) {
    if (item.type !== 'group' || !item.children?.length) continue
    const siblingTos = item.children.map((child) => child.to)
    const active = item.children.some((child) => isNavPathActive(activePath, child.to, siblingTos))
    if (active) return item.label
  }
  return null
}
