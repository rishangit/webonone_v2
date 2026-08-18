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
import type { WebsiteFontToken } from '../../types'
import { writeThemeDraft } from '../../utils/themeDraftStorage'
import { upsertById } from '../../utils/upsertById'
import { ThemeEditorListHeader } from './ThemeEditorListHeader'
import { ThemeFontDialog } from './ThemeFontDialog'
import type { ThemeEditorTabProps } from './types'

type ThemeFontsTabProps = ThemeEditorTabProps & {
  onFontInUse: () => void
}

export function ThemeFontsTab({ theme, onChange, onFontInUse }: ThemeFontsTabProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [dialog, setDialog] = useState<{ font?: WebsiteFontToken } | null>(null)

  function openDialog(font?: WebsiteFontToken) {
    writeThemeDraft(theme)
    setDialog({ font })
  }

  function removeFont(id: string) {
    if (theme.textStyles.some((style) => style.fontId === id)) {
      onFontInUse()
      return
    }
    onChange({ ...theme, fonts: theme.fonts.filter((font) => font.id !== id) })
  }

  return (
    <div className="space-y-2">
      <ThemeEditorListHeader title={t('fonts')} addLabel={t('addFont')} onAdd={() => openDialog()} />
      {theme.fonts.length === 0 ? (
        <ItemListEmpty>{t('emptyFonts')}</ItemListEmpty>
      ) : (
        <ItemList>
          {theme.fonts.map((font) => (
            <ItemListItem key={font.id}>
              <ItemListContent>
                <button
                  type="button"
                  className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openDialog(font)}
                >
                  <p className="font-medium">{font.name}</p>
                  <p className="text-sm text-muted-foreground">{font.family || font.googleFontUrl}</p>
                </button>
              </ItemListContent>
              <ItemListMenu ariaLabel={t('actionsFor', { name: font.name || t('fonts') })}>
                <DropdownMenuItem onClick={() => openDialog(font)}>{tc('edit')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => removeFont(font.id)}
                >
                  {tc('delete')}
                </DropdownMenuItem>
              </ItemListMenu>
            </ItemListItem>
          ))}
        </ItemList>
      )}
      <ThemeFontDialog
        open={dialog !== null}
        themeId={theme.id}
        initial={dialog?.font}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={(font) => {
          onChange({ ...theme, fonts: upsertById(theme.fonts, font) })
          setDialog(null)
        }}
      />
    </div>
  )
}
