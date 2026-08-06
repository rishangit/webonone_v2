import { useTranslation } from 'react-i18next'
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
  emptyMessage,
}: ThemeListProps) {
  const { t } = useTranslation('settings')
  const items = Array.isArray(themes) ? themes : []
  const empty = emptyMessage ?? t('noThemes')

  if (items.length === 0) {
    return <ItemListEmpty>{empty}</ItemListEmpty>
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
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(theme.id)}
              >
                <p className="font-medium">{theme.name}</p>
                {theme.isSystem ? (
                  <p className="text-xs text-muted-foreground">{t('systemThemeType')}</p>
                ) : null}
                <div className="mt-2 flex gap-1">
                  {[theme.color1, theme.color2, theme.color3, theme.color4, theme.color5].map(
                    (c) => (
                      <span
                        key={`${theme.id}-${c}`}
                        className="h-6 w-6 rounded border border-border"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ),
                  )}
                </div>
              </button>
            </ItemListContent>
            <ItemListMenu ariaLabel={`${t('common:actions')} — ${theme.name}`}>
              <DropdownMenuItem onClick={() => onOpen(theme.id)}>
                {t('viewDetails')}
              </DropdownMenuItem>
              {isActive ? (
                <DropdownMenuItem disabled>{t('active')}</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onApply(theme.id)}>{t('apply')}</DropdownMenuItem>
              )}
              {!theme.isSystem ? (
                <>
                  <DropdownMenuItem onClick={() => onEdit(theme)}>
                    {t('common:edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(theme.id)}
                  >
                    {t('common:delete')}
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
