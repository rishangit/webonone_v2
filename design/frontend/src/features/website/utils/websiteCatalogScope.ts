/** When true, website entity APIs read and write the platform library instead of a company site. */
let libraryCatalog = false

export function setWebsiteLibraryCatalog(enabled: boolean): void {
  libraryCatalog = enabled
}

export function isWebsiteLibraryCatalog(): boolean {
  return libraryCatalog
}

const REWRITES: Array<[string, string]> = [
  ['/website-themes', '/website/library/themes'],
  ['/website/pages', '/website/library/pages'],
  ['/website/presets', '/website/library/presets'],
  ['/website/layouts', '/website/library/layouts'],
  ['/website/headers', '/website/library/headers'],
  ['/website/footers', '/website/library/footers'],
]

/** Map a company website entity path onto the library API while a super admin is signed in. */
export function websiteEntityPath(path: string): string {
  if (!libraryCatalog) return path
  for (const [from, to] of REWRITES) {
    if (path === from || path.startsWith(`${from}/`) || path.startsWith(`${from}?`)) {
      return to + path.slice(from.length)
    }
  }
  return path
}
