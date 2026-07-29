/** Pathname portion of a nav `to` value (strips `?query` from in-app routes). */
export function navTargetPath(to: string): string {
  const queryIndex = to.indexOf('?')
  if (queryIndex === -1) {
    return to
  }
  return to.slice(0, queryIndex)
}

function pathMatchesActive(activePath: string, target: string): boolean {
  return activePath === target || activePath.startsWith(`${target}/`)
}

/**
 * Whether `to` should show as the active nav item for `activePath`.
 *
 * When `siblingTos` is provided (e.g. children in a NavGroup), the **longest**
 * matching sibling wins — so `/calendar/events` highlights Events, not Schedule
 * at `/calendar/schedule`.
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
