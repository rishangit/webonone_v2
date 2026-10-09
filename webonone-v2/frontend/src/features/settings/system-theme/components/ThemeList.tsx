import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { themeDtoToColors } from '@webonone/theme'
import {
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'
import type { ApiTheme } from '../services/themeApi'
import { THEME_COLOR_KEYS } from '../constants/defaultThemeFormValues'

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
  const { t: tc } = useTranslation('common')
  const items = Array.isArray(themes) ? themes : []
  const empty = emptyMessage ?? t('noThemes')

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: ApiTheme, b: ApiTheme) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (theme: ApiTheme) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpen(theme.id)}
          >
            {theme.name}
          </button>
        ),
      },
      {
        id: 'type',
        header: t('systemTheme.list.columnType'),
        cell: (theme: ApiTheme) =>
          theme.isSystem ? t('systemThemeType') : t('systemTheme.list.customType'),
      },
    ],
    [onOpen, t, tc],
  )

  function renderRowMenu(theme: ApiTheme) {
    const isActive = activeThemeId === theme.id
    return (
      <ItemListMenu ariaLabel={`${tc('actions')} — ${theme.name}`}>
        <DropdownMenuItem onClick={() => onOpen(theme.id)}>{t('viewDetails')}</DropdownMenuItem>
        {isActive ? (
          <DropdownMenuItem disabled>{t('active')}</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onApply(theme.id)}>{t('apply')}</DropdownMenuItem>
        )}
        {!theme.isSystem ? (
          <>
            <DropdownMenuItem onClick={() => onEdit(theme)}>{tc('edit')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(theme.id)}
            >
              {tc('delete')}
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function themeCardImage(theme: ApiTheme) {
    return (
      <div className="flex h-full w-full">
        {THEME_COLOR_KEYS.map((key) => {
          const c = themeDtoToColors(theme)[key]
          return (
            <span
              key={`${theme.id}-${key}-card`}
              className="min-w-0 flex-1"
              style={{ backgroundColor: c }}
              title={c}
            />
          )
        })}
      </div>
    )
  }

  function themeDetails(theme: ApiTheme) {
    return (
      <>
        <p className="font-medium">{theme.name}</p>
        {theme.isSystem ? (
          <p className="text-xs text-muted-foreground">{t('systemThemeType')}</p>
        ) : null}
      </>
    )
  }

  function rowBody(theme: ApiTheme) {
    return (
      <>
        {themeDetails(theme)}
        <div className="mt-2 flex gap-1">
          {THEME_COLOR_KEYS.map((key) => {
            const c = themeDtoToColors(theme)[key]
            return (
              <span
                key={`${theme.id}-${key}`}
                className="h-6 w-6 rounded border border-border"
                style={{ backgroundColor: c }}
                title={c}
              />
            )
          })}
        </div>
      </>
    )
  }

  return (
    <CollectionListView
      items={items}
      getRowKey={(theme) => theme.id}
      columns={columns}
      empty={<ItemListEmpty>{empty}</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      getGridRowClassName={(theme) =>
        activeThemeId === theme.id ? itemListRowActiveClassName : undefined
      }
      renderListItem={(theme) => {
        const isActive = activeThemeId === theme.id
        return (
          <ItemListItem className={isActive ? itemListRowActiveClassName : undefined}>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(theme.id)}
              >
                {rowBody(theme)}
              </button>
            </ItemListContent>
            {renderRowMenu(theme)}
          </ItemListItem>
        )
      }}
      renderCard={(theme) => (
        <ItemListCollectionCard
          className={activeThemeId === theme.id ? itemListRowActiveClassName : undefined}
          image={themeCardImage(theme)}
          menu={renderRowMenu(theme)}
          onBodyClick={() => onOpen(theme.id)}
        >
          {themeDetails(theme)}
        </ItemListCollectionCard>
      )}
    />
  )
}
