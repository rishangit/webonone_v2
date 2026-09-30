import type { CatalogKind } from '@/features/data/utils/dataPaths'
import type { CatalogReviewEntityKind } from '@webonone/mobile-ui'

const PRICED_KINDS = new Set<CatalogKind>(['products', 'services', 'spaces'])

export function isReviewableCatalogKind(kind: CatalogKind): boolean {
  return PRICED_KINDS.has(kind)
}

export function catalogKindToReviewKind(kind: CatalogKind): CatalogReviewEntityKind | null {
  if (kind === 'products') return 'product'
  if (kind === 'services') return 'service'
  if (kind === 'spaces') return 'space'
  return null
}
