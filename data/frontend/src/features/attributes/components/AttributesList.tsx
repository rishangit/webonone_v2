import { useState } from 'react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { Attribute } from '@/shared/types/data.types'

interface AttributesListProps {
  items: Attribute[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  canMutate: boolean
}

export function AttributesList({
  items,
  onEdit,
  onDeleted,
  onVerify,
  canMutate,
}: AttributesListProps) {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  if (items.length === 0) return <ItemListEmpty>No attributes found.</ItemListEmpty>

  return (
    <>
      <ItemList>
        {items.map((item) => (
          <ItemListItem key={item.id}>
            <ItemListContent>
              <div className="flex items-center gap-2">
                <p className="font-medium">{item.name}</p>
                <StatusBadge status={item.status} />
                <span className="text-xs text-muted-foreground">Refs: {item.referenceCount ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.valueType}
                {item.unit ? ` · ${item.unit.name} (${item.unit.symbol})` : ''}
              </p>
            </ItemListContent>
            {canMutate ? (
              <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
                {item.status === 'pending' && onVerify ? (
                  <DropdownMenuItem onClick={() => onVerify(item.id)}>Verify</DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => onEdit(item.id)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                >
                  Delete
                </DropdownMenuItem>
              </ItemListMenu>
            ) : null}
          </ItemListItem>
        ))}
      </ItemList>
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete attribute?'}
        description="This action cannot be undone. The attribute will be permanently removed."
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) onDeleted(pendingDelete.id)
        }}
      />
    </>
  )
}
