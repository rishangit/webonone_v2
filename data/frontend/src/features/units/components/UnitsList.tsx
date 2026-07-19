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
import type { Unit } from '@/shared/types/data.types'

interface UnitsListProps {
  items: Unit[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  canMutate: boolean
}

export function UnitsList({ items, onEdit, onDeleted, canMutate }: UnitsListProps) {
  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete unit "${name}"?`)) return
    onDeleted(id)
  }

  if (items.length === 0) return <ItemListEmpty>No units found.</ItemListEmpty>

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {item.name} ({item.symbol})
              </p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {item.isBase ? 'Base unit' : item.baseUnitId ? `Derived · base ${item.baseUnitId}` : 'Derived'}
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
