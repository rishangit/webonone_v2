import { useState } from 'react'
import { Pressable } from 'react-native'
import {
  ConfirmDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
} from '@webonone/mobile-ui'
import { EntityStatusTag } from '@/features/data/components/EntityStatusTag'
import type { Tag } from '@/shared/types/data.types'

export function TagsList({
  items,
  busyId,
  canMutate,
  canDelete,
  onOpen,
  onEdit,
  onVerify,
  onDelete,
  emptyMessage = 'No tags found.',
}: {
  items: Tag[]
  busyId: string | null
  canMutate: boolean
  canDelete: boolean
  onOpen: (tag: Tag) => void
  onEdit: (tag: Tag) => void
  onVerify: (tag: Tag) => void
  onDelete: (tag: Tag) => void
  emptyMessage?: string
}) {
  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {items.map((item) => {
          const isBusy = busyId === item.id
          return (
            <ItemListItem key={item.id}>
              <Pressable className="min-w-0 flex-1" onPress={() => onOpen(item)}>
                <ItemListContent
                  title={item.name}
                  subtitle={`${item.referenceCount} refs${item.description ? ` · ${item.description}` : ''}`}
                />
              </Pressable>
              <EntityStatusTag status={item.status} />
              <ItemListMenu ariaLabel={`Actions — ${item.name}`}>
                <ItemListMenuItem disabled={isBusy} onPress={() => onOpen(item)}>
                  View details
                </ItemListMenuItem>
                {canMutate && item.status === 'pending' ? (
                  <ItemListMenuItem disabled={isBusy} onPress={() => onVerify(item)}>
                    Verify
                  </ItemListMenuItem>
                ) : null}
                {canMutate ? (
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
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete tag?'}
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
