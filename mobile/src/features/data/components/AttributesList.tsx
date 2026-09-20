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
import type { Attribute } from '@/shared/types/data.types'

export function AttributesList({
  items,
  busyId,
  canMutate,
  canDelete,
  onOpen,
  onEdit,
  onVerify,
  onDelete,
  emptyMessage = 'No attributes found.',
}: {
  items: Attribute[]
  busyId: string | null
  canMutate: boolean
  canDelete: boolean
  onOpen: (attribute: Attribute) => void
  onEdit: (attribute: Attribute) => void
  onVerify: (attribute: Attribute) => void
  onDelete: (attribute: Attribute) => void
  emptyMessage?: string
}) {
  const [pendingDelete, setPendingDelete] = useState<Attribute | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {items.map((item) => {
          const isBusy = busyId === item.id
          const unitLabel = item.unit ? ` · ${item.unit.symbol}` : ''
          return (
            <ItemListItem key={item.id}>
              <Pressable className="min-w-0 flex-1" onPress={() => onOpen(item)}>
                <ItemListContent
                  title={item.name}
                  subtitle={`${item.valueType}${unitLabel} · ${item.referenceCount} refs`}
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
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete attribute?'}
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
