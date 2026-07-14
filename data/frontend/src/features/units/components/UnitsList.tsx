import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
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
  onDeleted: (id: string) => void
  canMutate: boolean
}

export function UnitsList({ items, onDeleted, canMutate }: UnitsListProps) {
  const navigate = useNavigate()

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
              <DropdownMenuItem onClick={() => navigate(`/units/${item.id}`)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
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
