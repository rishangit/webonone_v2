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
import type { CatalogItem } from '@/shared/types/data.types'

interface CatalogListProps {
  itemType: string
  items: CatalogItem[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  onView?: (id: string) => void
  canEdit: boolean
  canDelete: boolean
}

export function CatalogList({
  itemType,
  items,
  onEdit,
  onDeleted,
  onVerify,
  onView,
  canEdit,
  canDelete,
}: CatalogListProps) {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const singularLabel =
    itemType === 'products'
      ? 'product'
      : itemType === 'services'
        ? 'service'
        : itemType === 'spaces'
          ? 'space'
          : itemType.replace(/s$/, '') || itemType

  if (items.length === 0) return <ItemListEmpty>No {itemType} found.</ItemListEmpty>

  return (
    <>
      <ItemList>
        {items.map((item) => {
          const showMenu = Boolean(onView) || canEdit || canDelete
          return (
            <ItemListItem key={item.id}>
              <ItemListContent>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.name}</p>
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-muted-foreground">Refs: {item.referenceCount ?? 0}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs">
                      {tag.name}
                    </span>
                  ))}
                  {item.tags.length > 3 ? (
                    <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                  ) : null}
                </div>
              </ItemListContent>
              {showMenu ? (
                <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
                  {onView ? (
                    <DropdownMenuItem onClick={() => onView(item.id)}>View service</DropdownMenuItem>
                  ) : null}
                  {canDelete && item.status === 'pending' && onVerify ? (
                    <DropdownMenuItem onClick={() => onVerify(item.id)}>Verify</DropdownMenuItem>
                  ) : null}
                  {canEdit ? (
                    <DropdownMenuItem onClick={() => onEdit(item.id)}>Edit</DropdownMenuItem>
                  ) : null}
                  {canDelete ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                      >
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          )
        })}
      </ItemList>
      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        title={`Delete ${singularLabel}`}
        description={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This cannot be undone.`
            : `Delete this ${singularLabel}? This cannot be undone.`
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
