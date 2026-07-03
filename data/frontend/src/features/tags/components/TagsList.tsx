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
import { dataApi } from '@/shared/services/dataApi'
import type { Tag } from '@/shared/types/data.types'

interface TagsListProps {
  items: Tag[]
  onDeleted: () => void
  canMutate: boolean
}

export function TagsList({ items, onDeleted, canMutate }: TagsListProps) {
  const navigate = useNavigate()

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete tag "${name}"?`)) return
    await dataApi.deleteTag(id)
    onDeleted()
  }

  if (items.length === 0) {
    return <ItemListEmpty>No tags found.</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full border"
                style={{ backgroundColor: item.color }}
              />
              <p className="font-medium">{item.name}</p>
              <StatusBadge status={item.status} />
            </div>
            {item.description ? (
              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </ItemListContent>
          {canMutate ? (
            <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
              <DropdownMenuItem onClick={() => navigate(`/tags/${item.id}`)}>Edit</DropdownMenuItem>
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
