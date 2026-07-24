import { useState } from 'react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { Unit } from '@/shared/types/data.types'

interface UnitsListProps {
  items: Unit[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  canMutate: boolean
}

export function UnitsList({ items, onEdit, onDeleted, onVerify, canMutate }: UnitsListProps) {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  if (items.length === 0) return <ItemListEmpty>No units found.</ItemListEmpty>

  return (
    <>
      <ItemList>
        {items.map((item) => (
          <ItemListItem key={item.id}>
            <ItemListContent>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {item.name} ({item.symbol})
                </p>
                <StatusBadge status={item.status} />
                <span className="text-xs text-muted-foreground">Refs: {item.referenceCount ?? 0}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.isBase ? 'Base unit' : item.baseUnitId ? `Derived · base ${item.baseUnitId}` : 'Derived'}
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
      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        title="Delete unit"
        description={
          pendingDelete
            ? `Delete unit "${pendingDelete.name}"? This cannot be undone.`
            : 'Delete this unit? This cannot be undone.'
        }
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
