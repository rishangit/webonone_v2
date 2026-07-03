import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ListEmptyState,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { dataApi } from '@/shared/services/dataApi'
import type { Unit } from '@/shared/types/data.types'

interface UnitsListProps {
  items: Unit[]
  onDeleted: () => void
  canMutate: boolean
}

export function UnitsList({ items, onDeleted, canMutate }: UnitsListProps) {
  const navigate = useNavigate()

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete unit "${name}"?`)) return
    await dataApi.deleteUnit(id)
    onDeleted()
  }

  if (items.length === 0) return <ListEmptyState itemType="units" />

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
                onClick={() => void handleDelete(item.id, item.name)}
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
