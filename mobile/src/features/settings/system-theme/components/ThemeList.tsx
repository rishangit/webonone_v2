import { Pressable } from 'react-native'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
} from '@webonone/mobile-ui'
import { ThemeColorSwatches } from '@/features/settings/system-theme/components/ThemeColorSwatches'
import type { ApiTheme } from '@/features/settings/system-theme/services/themeApi'

interface ThemeListProps {
  themes: ApiTheme[]
  activeThemeId: string | null
  onOpen: (id: string) => void
  onApply: (id: string) => void
  onEdit: (theme: ApiTheme) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}

export function ThemeList({
  themes,
  activeThemeId,
  onOpen,
  onApply,
  onEdit,
  onDelete,
  emptyMessage = 'No themes yet.',
}: ThemeListProps) {
  if (themes.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList>
      {themes.map((theme) => {
        const isActive = activeThemeId === theme.id

        return (
          <ItemListItem key={theme.id} selected={isActive}>
            <Pressable className="min-w-0 flex-1 gap-2" onPress={() => onOpen(theme.id)}>
              <ItemListContent
                title={theme.name}
                subtitle={theme.isSystem ? 'System theme' : undefined}
              />
              <ThemeColorSwatches theme={theme} />
            </Pressable>
            <ItemListMenu ariaLabel={`Actions — ${theme.name}`}>
              <ItemListMenuItem onPress={() => onOpen(theme.id)}>View details</ItemListMenuItem>
              {isActive ? (
                <ItemListMenuItem disabled>Active</ItemListMenuItem>
              ) : (
                <ItemListMenuItem onPress={() => onApply(theme.id)}>Apply</ItemListMenuItem>
              )}
              {!theme.isSystem ? (
                <>
                  <ItemListMenuItem onPress={() => onEdit(theme)}>Edit</ItemListMenuItem>
                  <ItemListMenuSeparator />
                  <ItemListMenuItem destructive onPress={() => onDelete(theme.id)}>
                    Delete
                  </ItemListMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
