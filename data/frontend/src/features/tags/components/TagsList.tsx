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
import type { Tag } from '@/shared/types/data.types'

interface TagsListProps {
  items: Tag[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  canMutate: boolean
}

export function TagsList({ items, onEdit, onDeleted, onVerify, canMutate }: TagsListProps) {
  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete tag "${name}"?`)) return
    onDeleted(id)
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
              <span className="text-xs text-muted-foreground">Refs: {item.referenceCount ?? 0}</span>
            </div>
            {item.description ? (
              <p className="truncate text-xs text-muted-foreground">{item.description}</p>
            ) : null}
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
