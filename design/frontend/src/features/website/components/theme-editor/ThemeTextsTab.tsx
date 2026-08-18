import { useState } from 'react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { resolveTextStyle } from '../../document/theme'
import type { WebsiteTextStyle } from '../../types'
import { writeThemeDraft } from '../../utils/themeDraftStorage'
import { upsertById } from '../../utils/upsertById'
import { ThemeEditorListHeader } from './ThemeEditorListHeader'
import { ThemeTextStyleDialog } from './ThemeTextStyleDialog'
import type { ThemeEditorTabProps } from './types'

type ThemeTextsTabProps = ThemeEditorTabProps & {
  onTextStyleInUse: () => void
}

export function ThemeTextsTab({ theme, onChange, onTextStyleInUse }: ThemeTextsTabProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [dialog, setDialog] = useState<{ style?: WebsiteTextStyle } | null>(null)

  function openDialog(style?: WebsiteTextStyle) {
    writeThemeDraft(theme)
    setDialog({ style })
  }

  function removeTextStyle(id: string) {
    if (theme.buttonStyles.some((style) => style.textStyleId === id)) {
      onTextStyleInUse()
      return
    }
    onChange({ ...theme, textStyles: theme.textStyles.filter((style) => style.id !== id) })
  }

  return (
    <div className="space-y-2">
      <ThemeEditorListHeader title={t('texts')} addLabel={t('addTextStyle')} onAdd={() => openDialog()} />
      {theme.textStyles.length === 0 ? (
        <ItemListEmpty>{t('emptyTextStyles')}</ItemListEmpty>
      ) : (
        <ItemList>
          {theme.textStyles.map((style) => {
            const snap = resolveTextStyle(theme, style, 'lg')
            const font = theme.fonts.find((item) => item.id === style.fontId)
            return (
              <ItemListItem key={style.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openDialog(style)}
                  >
                    <p className="font-medium" style={{ fontFamily: snap.fontFamily, color: snap.color }}>
                      {style.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[font?.name || font?.family, `${snap.size}px`].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={t('actionsFor', { name: style.name || t('texts') })}>
                  <DropdownMenuItem onClick={() => openDialog(style)}>{tc('edit')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => removeTextStyle(style.id)}
                  >
                    {tc('delete')}
                  </DropdownMenuItem>
                </ItemListMenu>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
      <ThemeTextStyleDialog
        open={dialog !== null}
        theme={theme}
        initial={dialog?.style}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={(style) => {
          onChange({ ...theme, textStyles: upsertById(theme.textStyles, style) })
          setDialog(null)
        }}
      />
    </div>
  )
}
