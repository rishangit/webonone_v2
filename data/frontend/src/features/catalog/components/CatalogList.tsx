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
import type { CatalogItem } from '@/shared/types/data.types'

interface CatalogListProps {
  itemType: string
  items: CatalogItem[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  canMutate: boolean
}

export function CatalogList({ itemType, items, onEdit, onDeleted, canMutate }: CatalogListProps) {
  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"?`)) return
    onDeleted(id)
  }

  if (items.length === 0) return <ItemListEmpty>No {itemType} found.</ItemListEmpty>

  return (
    <ItemList>
      {items.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <div className="flex items-center gap-2">
              <p className="font-medium">{item.name}</p>
              <StatusBadge status={item.status} />
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
