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
import type { Attribute } from '@/shared/types/data.types'

interface AttributesListProps {
  items: Attribute[]
  onDeleted: () => void
  canMutate: boolean
}

export function AttributesList({ items, onDeleted, canMutate }: AttributesListProps) {
  const navigate = useNavigate()

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete attribute "${name}"?`)) return
    await dataApi.deleteAttribute(id)
    onDeleted()
  }

  if (items.length === 0) return <ListEmptyState itemType="attributes" />

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
              <DropdownMenuItem onClick={() => navigate(`/attributes/${item.id}`)}>Edit</DropdownMenuItem>
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
