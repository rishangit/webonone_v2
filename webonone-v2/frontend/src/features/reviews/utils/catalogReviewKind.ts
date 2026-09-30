import type { CatalogEntityKind } from '@/features/company-catalog/types/companyCatalog.types'
import type { CatalogReviewEntityKind } from '@webonone/ui-kit'

const PRICED_KINDS = new Set<CatalogEntityKind>(['products', 'services', 'spaces'])

export function isReviewableCatalogKind(kind: CatalogEntityKind): boolean {
  return PRICED_KINDS.has(kind)
}

export function catalogKindToReviewKind(kind: CatalogEntityKind): CatalogReviewEntityKind | null {
  if (kind === 'products') return 'product'
  if (kind === 'services') return 'service'
  if (kind === 'spaces') return 'space'
  return null
}
