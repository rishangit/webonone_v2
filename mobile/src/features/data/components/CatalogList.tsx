import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  ConfirmDialog,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  TagChip,
} from '@webonone/mobile-ui'
import { EntityStatusTag } from '@/features/data/components/EntityStatusTag'
import type { CatalogItem } from '@/shared/types/data.types'

export function CatalogList({
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
          const thumb = item.galleryImages[0]?.url ?? null
          return (
            <ItemListItem key={item.id}>
              <ImagePreview src={thumb} alt={item.name} className="mr-3 h-10 w-10 rounded-md" />
              <Pressable className="min-w-0 flex-1" onPress={() => onOpen(item)}>
                <ItemListContent
                  title={item.name}
                  subtitle={`${item.referenceCount} refs${item.description ? ` · ${item.description}` : ''}`}
                />
                {item.tags.length > 0 ? (
                  <View className="mt-1 flex-row flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <TagChip key={tag.id} name={tag.name} color={tag.color} />
                    ))}
                  </View>
                ) : null}
              </Pressable>
              <EntityStatusTag status={item.status} />
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
            </ItemListItem>
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
