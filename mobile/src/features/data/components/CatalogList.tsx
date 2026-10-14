import { useState } from 'react'
import { View } from 'react-native'
import {
  ConfirmDialog,
  ItemList,
  ItemListEmpty,
  ItemListMenu,
  ItemListMenuItem,
  TagChip,
} from '@webonone/mobile-ui'
import { CatalogEntityListRow } from '@/features/data/components/CatalogEntityListRow'
import { EntityStatusTag } from '@/features/data/components/EntityStatusTag'
import { ServiceListMeta } from '@/features/data/components/ServiceListMeta'
import type { CatalogKind } from '@/features/data/utils/dataPaths'
import type { CatalogItem } from '@/shared/types/data.types'

export function CatalogList({
  kind,
  items,
  busyId,
  canEdit,
  canDelete,
  onOpen,
  onEdit,
  onVerify,
  onDelete,
  emptyMessage = 'No items found.',
}: {
  kind?: CatalogKind
  items: CatalogItem[]
  busyId: string | null
  canEdit: boolean
  canDelete: boolean
  onOpen: (item: CatalogItem) => void
  onEdit: (item: CatalogItem) => void
  onVerify: (item: CatalogItem) => void
  onDelete: (item: CatalogItem) => void
  emptyMessage?: string
}) {
  const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {items.map((item) => {
          const isBusy = busyId === item.id
          return (
            <CatalogEntityListRow
              key={item.id}
              thumbUrl={item.galleryImages[0]?.url ?? null}
              name={item.name}
              subtitle={`${item.referenceCount} refs${item.description ? ` · ${item.description}` : ''}`}
              onOpen={() => onOpen(item)}
              trailing={<EntityStatusTag status={item.status} />}
              menu={
                <ItemListMenu ariaLabel={`Actions — ${item.name}`}>
                  <ItemListMenuItem disabled={isBusy} onPress={() => onOpen(item)}>
                    View details
                  </ItemListMenuItem>
                  {canDelete && item.status === 'pending' ? (
                    <ItemListMenuItem disabled={isBusy} onPress={() => onVerify(item)}>
                      Verify
                    </ItemListMenuItem>
                  ) : null}
                  {canEdit ? (
                    <ItemListMenuItem disabled={isBusy} onPress={() => onEdit(item)}>
                      Edit
                    </ItemListMenuItem>
                  ) : null}
                  {canDelete ? (
                    <ItemListMenuItem
                      disabled={isBusy}
                      destructive
                      onPress={() => setPendingDelete(item)}
                    >
                      Delete
                    </ItemListMenuItem>
                  ) : null}
                </ItemListMenu>
              }
            >
              {kind === 'services' ? <ServiceListMeta item={item} className="mt-1" /> : null}
              {item.tags.length > 0 ? (
                <View className="mt-1 flex-row flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <TagChip key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </View>
              ) : null}
            </CatalogEntityListRow>
          )
        })}
      </ItemList>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete item?'}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        busy={pendingDelete !== null && busyId === pendingDelete.id}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete)
          setPendingDelete(null)
        }}
      />
    </>
  )
}
