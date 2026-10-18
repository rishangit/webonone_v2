import { isCatalogKind, type CatalogKind } from '@/features/catalog/types/catalog.types'

/** Public website path for a published catalog item. Company id is in the path so a shared link identifies the company. */
export function publicCatalogItemPath(companyId: string, kind: string, id: string): string {
  return `/catalog/${encodeURIComponent(companyId)}/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`
}

export type ParsedCatalogDetailPath = {
  companyId: string | null
  kind: CatalogKind | null
  id: string
}

/** Accepts `/catalog/{companyId}/{kind}/{id}` and the older `/catalog/{kind}/{id}`. */
export function parseCatalogDetailPath(pathname: string): ParsedCatalogDetailPath {
  const segments = pathname.split('/').filter(Boolean)
  const rest = segments[0] === 'catalog' ? segments.slice(1) : segments
  if (rest.length >= 3 && isCatalogKind(rest[1] ?? '')) {
    return {
      companyId: decodeURIComponent(rest[0] ?? ''),
      kind: rest[1] as CatalogKind,
      id: decodeURIComponent(rest[2] ?? ''),
    }
  }
  if (rest.length >= 2 && isCatalogKind(rest[0] ?? '')) {
    return {
      companyId: null,
      kind: rest[0] as CatalogKind,
      id: decodeURIComponent(rest[1] ?? ''),
    }
  }
  return { companyId: null, kind: null, id: '' }
}
