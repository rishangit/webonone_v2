/** True for in-app relative paths (not protocol-relative or absolute URLs). */
export function isLocalNavPath(to: string): boolean {
  return to.startsWith('/') && !to.startsWith('//')
}
