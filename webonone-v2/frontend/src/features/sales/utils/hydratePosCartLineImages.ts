import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import type { CatalogEntityKind } from '@/features/company-catalog/types/companyCatalog.types'
import { catalogItemImageUrl } from '@/features/company-catalog/utils/firstGalleryImageUrl'
import { hydrateLinkedCatalogItems } from '@/features/company-catalog/utils/hydrateLinkedCatalog'
import type { PosCartLine, SaleItemKind } from '@/features/sales/types/sales.types'

const KIND_TO_CATALOG: Record<SaleItemKind, CatalogEntityKind> = {
  product: 'products',
  service: 'services',
  space: 'spaces',
}

export async function hydratePosCartLineImages(lines: PosCartLine[]): Promise<PosCartLine[]> {
  return Promise.all(
    lines.map(async (line) => {
      if (line.imageUrl) return line
      const catalogKind = KIND_TO_CATALOG[line.itemKind]
      try {
        const raw = await companyCatalogApi.get(catalogKind, line.catalogItemId)
        const [hydrated] = await hydrateLinkedCatalogItems(catalogKind, [raw])
        return { ...line, imageUrl: catalogItemImageUrl(hydrated) }
      } catch {
        return line
      }
    }),
  )
}
