# Item list examples

## Basic list with edit and delete

```tsx
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'

interface Theme {
  id: string
  name: string
}

interface ThemeListProps {
  themes: Theme[]
  activeId: string | null
  onSelect: (id: string) => void
  onEdit: (theme: Theme) => void
  onDelete: (id: string) => void
}

export function ThemeList({ themes, activeId, onSelect, onEdit, onDelete }: ThemeListProps) {
  const rows = Array.isArray(themes) ? themes : []

  if (rows.length === 0) {
    return <ItemListEmpty>No themes yet.</ItemListEmpty>
  }

  return (
    <ItemList>
      {rows.map((theme) => (
        <ItemListItem
          key={theme.id}
          className={activeId === theme.id ? itemListRowActiveClassName : undefined}
        >
          <ItemListContent>
            <button
              type="button"
              className="w-full text-left font-medium"
              onClick={() => onSelect(theme.id)}
            >
              {theme.name}
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel={`Actions for ${theme.name}`}>
            <DropdownMenuItem onClick={() => onSelect(theme.id)}>
              {activeId === theme.id ? 'Active' : 'Apply'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(theme)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(theme.id)}
            >
              Delete
            </DropdownMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
```

## Row with metadata

```tsx
<ItemListItem>
  <ItemListContent>
    <p className="font-medium">{item.title}</p>
    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
  </ItemListContent>
  <ItemListMenu ariaLabel={`Actions for ${item.title}`}>
    <DropdownMenuItem onClick={() => onOpen(item.id)}>Open</DropdownMenuItem>
  </ItemListMenu>
</ItemListItem>
```

## Conditional menu items

```tsx
<ItemListMenu ariaLabel={`Actions for ${theme.name}`}>
  <DropdownMenuItem onClick={() => onApply(theme.id)}>Apply</DropdownMenuItem>
  {!theme.isSystem ? (
    <>
      <DropdownMenuItem onClick={() => onEdit(theme)}>Edit</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() => onDelete(theme.id)}
      >
        Delete
      </DropdownMenuItem>
    </>
  ) : null}
</ItemListMenu>
```

## Anti-pattern (do not copy)

```tsx
// ❌ Vertically centered menu on tall rows — use ItemListItem + ItemListMenu defaults
<ItemListItem className="flex items-center">...</ItemListItem>

// ❌ Inline buttons — inconsistent padding, clutters rows
<li className="flex justify-between p-4">
  <span>{theme.name}</span>
  <div className="flex gap-2">
    <Button onClick={onEdit}>Edit</Button>
    <Button variant="destructive" onClick={onDelete}>Delete</Button>
  </div>
</li>
```
