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
import { buttonLabelTypography, resolveButtonStyle } from '../../document/theme'
import type { WebsiteButtonStyle } from '../../types'
import { writeThemeDraft } from '../../utils/themeDraftStorage'
import { upsertById } from '../../utils/upsertById'
import { ThemeButtonStyleDialog } from './ThemeButtonStyleDialog'
import { ThemeEditorListHeader } from './ThemeEditorListHeader'
import type { ThemeEditorTabProps } from './types'

export function ThemeButtonsTab({ theme, onChange }: ThemeEditorTabProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [dialog, setDialog] = useState<{ style?: WebsiteButtonStyle } | null>(null)

  function openDialog(style?: WebsiteButtonStyle) {
    writeThemeDraft(theme)
    setDialog({ style })
  }

  function removeButtonStyle(id: string) {
    onChange({
      ...theme,
      buttonStyles: theme.buttonStyles.filter((style) => style.id !== id),
    })
  }

  return (
    <div className="space-y-2">
      <ThemeEditorListHeader title={t('buttons')} addLabel={t('addButtonStyle')} onAdd={() => openDialog()} />
      {theme.buttonStyles.length === 0 ? (
        <ItemListEmpty>{t('emptyButtonStyles')}</ItemListEmpty>
      ) : (
        <ItemList>
          {theme.buttonStyles.map((style) => {
            const snap = resolveButtonStyle(theme, style)
            return (
              <ItemListItem key={style.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openDialog(style)}
                  >
                    <span
                      className="inline-flex shrink-0 items-center justify-center px-3 py-1 text-sm"
                      style={{
                        ...buttonLabelTypography(),
                        background: snap.background,
                        color: snap.textColor,
                        border: `${snap.borderWidth}px solid ${snap.borderColor}`,
                        borderRadius: snap.radius,
                        fontFamily: snap.fontFamily,
                      }}
                    >
                      {style.name || t('buttonPreviewLabel')}
                    </span>
                    <p className="min-w-0 truncate font-medium">{style.name}</p>
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={t('actionsFor', { name: style.name || t('buttons') })}>
                  <DropdownMenuItem onClick={() => openDialog(style)}>{tc('edit')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => removeButtonStyle(style.id)}
                  >
                    {tc('delete')}
                  </DropdownMenuItem>
                </ItemListMenu>
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
      <ThemeButtonStyleDialog
        open={dialog !== null}
        theme={theme}
        initial={dialog?.style}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={(style) => {
          onChange({ ...theme, buttonStyles: upsertById(theme.buttonStyles, style) })
          setDialog(null)
        }}
      />
    </div>
  )
}
