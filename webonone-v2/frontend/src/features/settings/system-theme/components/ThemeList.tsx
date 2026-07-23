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
import type { ApiTheme } from '../services/themeApi'

interface ThemeListProps {
  themes: ApiTheme[]
  activeThemeId: string | null
  onSelect: (id: string) => void
  onEdit: (theme: ApiTheme) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}

export function ThemeList({
  themes,
  activeThemeId,
  onSelect,
  onEdit,
  onDelete,
  emptyMessage = 'No themes yet.',
}: ThemeListProps) {
  const items = Array.isArray(themes) ? themes : []

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((theme) => {
        const isActive = activeThemeId === theme.id

        return (
          <ItemListItem key={theme.id} className={isActive ? itemListRowActiveClassName : undefined}>
            <ItemListContent>
              <button
                type="button"
                className="w-full text-left font-medium"
                onClick={() => onSelect(theme.id)}
              >
                {theme.name}
              </button>
              {theme.isSystem ? (
                <p className="text-xs text-muted-foreground">System theme</p>
              ) : null}
              <div className="mt-2 flex gap-1">
                {[theme.color1, theme.color2, theme.color3, theme.color4, theme.color5].map((c) => (
                  <span
                    key={c}
                    className="h-6 w-6 rounded border border-border"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </ItemListContent>
            <ItemListMenu ariaLabel={`Actions for ${theme.name}`}>
              {isActive ? (
                <DropdownMenuItem disabled>Active</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onSelect(theme.id)}>Apply</DropdownMenuItem>
              )}
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
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
