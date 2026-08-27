import { filterCompanyDataEntities, type DataEntityKey } from '@webonone/platform-nav'
import type { SaleItemKind } from '@/features/sales/types/sales.types'

const CATALOG_TO_SALE: Record<'products' | 'services' | 'spaces', SaleItemKind> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

export function resolvePosEnabledKinds(dataEntities: DataEntityKey[] | undefined): SaleItemKind[] {
  const enabled = filterCompanyDataEntities(dataEntities ?? [])
  const kinds = enabled
    .map((key) => CATALOG_TO_SALE[key as keyof typeof CATALOG_TO_SALE])
    .filter((kind): kind is SaleItemKind => Boolean(kind))
  return kinds.length > 0 ? kinds : (['product', 'service', 'space'] as SaleItemKind[])
}
