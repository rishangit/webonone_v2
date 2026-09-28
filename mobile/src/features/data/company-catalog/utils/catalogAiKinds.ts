import type { CatalogKind } from '@/features/data/utils/dataPaths'
import type { CatalogAiEntityKind } from '@webonone/platform-embed'

export const CATALOG_ENTITY_SINGULAR_KEYS: Record<CatalogKind, CatalogAiEntityKind> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}
