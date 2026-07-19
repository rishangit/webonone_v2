import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { Attribute } from '@/shared/types/data.types'

interface AttributesListProps {
  items: Attribute[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  canMutate: boolean
}

export function AttributesList({ items, onEdit, onDeleted, canMutate }: AttributesListProps) {
  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete attribute "${name}"?`)) return
    onDeleted(id)
  }

  if (items.length === 0) return <ItemListEmpty>No attributes found.</ItemListEmpty>

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <div className="flex items-center gap-2">
              <p className="font-medium">{item.name}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {item.valueType}
              {item.unitId ? ' · has unit' : ''}
            </p>
          </ItemListContent>
          {canMutate ? (
            <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
              <DropdownMenuItem onClick={() => onEdit(item.id)}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(item.id, item.name)}
              >
                Delete
              </DropdownMenuItem>
            </ItemListMenu>
          ) : null}
        </ItemListItem>
      ))}
    </ItemList>
  )
}
