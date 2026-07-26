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

## List row opens detail page

When the entity has a details/profile route, row body click must navigate there. Menu may duplicate View details; other actions stay menu-only.

```tsx
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'

interface Company {
  id: string
  name: string
  logoUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
}

interface CompaniesListProps {
  items: Company[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function CompaniesList({ items, onApprove, onReject }: CompaniesListProps) {
  const navigate = useNavigate()
  const rows = Array.isArray(items) ? items : []

  if (rows.length === 0) {
    return <ItemListEmpty>No companies yet.</ItemListEmpty>
  }

  function openProfile(id: string) {
    navigate(`/companies/${id}`)
  }

  return (
    <ItemList>
      {rows.map((item) => (
        <ItemListItem key={item.id}>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openProfile(item.id)}
            >
              <div className="flex items-start gap-3">
                <ImagePreview
                  src={item.logoUrl}
                  alt={item.name}
                  mode="view"
                  className="h-10 w-10 rounded-md"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{item.name}</p>
                    <StatusTag variant={item.status} />
                  </div>
                </div>
              </div>
            </button>
          </ItemListContent>
          <ItemListMenu ariaLabel={`Actions for ${item.name}`}>
            <DropdownMenuItem onClick={() => openProfile(item.id)}>View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onApprove(item.id)}>Approve</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onReject(item.id)}
            >
              Reject
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
