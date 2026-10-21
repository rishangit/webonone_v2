import { publicPageHref } from '../utils/companyPublicHost'

export function pageLinkHref(
  pages: Array<{ id: string; path: string }>,
  linkPageId: string | null | undefined,
  companyId: string | undefined,
  active: boolean,
): { path: string; href: string } | null {
  const id = linkPageId?.trim()
  if (!active || !id || !companyId) return null
  const page = pages.find((item) => item.id === id)
  if (!page) return null
  return { path: page.path, href: publicPageHref(companyId, page.path) }
}
