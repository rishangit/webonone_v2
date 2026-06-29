/** Pathname portion of a nav `to` value (strips `?query` from in-app routes). */
export function navTargetPath(to: string): string {
  const queryIndex = to.indexOf('?')
  if (queryIndex === -1) {
    return to
  }
  return to.slice(0, queryIndex)
}

export function isNavPathActive(activePath: string | undefined, to: string): boolean {
  if (!activePath) {
    return false
  }
  const target = navTargetPath(to)
  return activePath === target || activePath.startsWith(`${target}/`)
}
