/**
 * Allow SMS top-level routes and template nested paths
 * (`/sms/templates/:id`, `/preview`, `/versions`). Path may include a query string.
 */
export function isAllowedSmsShellNavigatePath(path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  if (!pathname.startsWith('/sms/')) return false
  const parts = pathname.slice(1).split('/').filter(Boolean)
  if (parts[0] !== 'sms' || parts.length < 2) return false
  if (parts.some((part) => !part || part.includes('..'))) return false

  const section = parts[1]
  const topLevel = new Set(['dashboard', 'send', 'gateway', 'devices', 'queue', 'history', 'templates'])
  if (!topLevel.has(section ?? '')) return false

  if (section === 'templates') {
    if (parts.length === 2 || parts.length === 3) return true
    if (parts.length === 4 && (parts[3] === 'preview' || parts[3] === 'versions')) {
      return true
    }
    return false
  }

  return parts.length === 2
}
