import { ProductFormDialog } from '@/features/data/components/ProductFormDialog'
import { ServiceFormDialog } from '@/features/data/components/ServiceFormDialog'
import { SpaceFormDialog } from '@/features/data/components/SpaceFormDialog'
import type { CatalogEntityKind } from '@/features/sales/types/catalog.types'
import type { LibraryListItem } from '@/features/sales/services/dataLibraryApi'

export function LibraryItemCreateHost({
  kind,
  open,
  onOpenChange,
  onCreated,
}: {
  kind: CatalogEntityKind
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (item: LibraryListItem) => void
}) {
  if (kind === 'products') {
    return (
      <ProductFormDialog
        open={open}
        canSetStatus={false}
        onOpenChange={onOpenChange}
        onLibraryCreate={onCreated}
      />
    )
  }
  if (kind === 'services') {
    return (
      <ServiceFormDialog
        open={open}
        canSetStatus={false}
        onOpenChange={onOpenChange}
        onLibraryCreate={onCreated}
      />
    )
  }
  if (kind === 'spaces') {
    return (
      <SpaceFormDialog
        open={open}
        canSetStatus={false}
        onOpenChange={onOpenChange}
        onLibraryCreate={onCreated}
      />
    )
  }
  return null
}
