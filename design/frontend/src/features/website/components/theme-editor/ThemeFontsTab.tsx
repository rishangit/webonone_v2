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
import { themeFontFamilyStyle } from '../../utils/themeFontPreview'
import { writeThemeDraft } from '../../utils/themeDraftStorage'
import { upsertById } from '../../utils/upsertById'
import { ThemeEditorListHeader } from './ThemeEditorListHeader'
import { ThemeFontDialog } from './ThemeFontDialog'
import { ThemeFontsGuideCallout } from './ThemeFontsGuideCallout'
import type { ThemeEditorTabProps } from './types'

type ThemeFontsTabProps = ThemeEditorTabProps & {
  onFontInUse: () => void
}

export function ThemeFontsTab({ theme, onPersist, saving, onFontInUse }: ThemeFontsTabProps) {
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
    onPersist({ ...theme, fonts: theme.fonts.filter((font) => font.id !== id) })
  }

  return (
    <div className="space-y-4">
      <ThemeEditorListHeader
        title={t('fonts')}
        addLabel={t('addFont')}
        onAdd={() => openDialog()}
        disabled={saving}
      />
      <ThemeFontsGuideCallout />
      {theme.fonts.length === 0 ? (
        <ItemListEmpty>{t('emptyFonts')}</ItemListEmpty>
      ) : (
        <ItemList>
          {theme.fonts.map((font) => {
            const previewStyle = themeFontFamilyStyle(font.family)
            return (
              <ItemListItem key={font.id}>
                <ItemListContent>
                  <button
                    type="button"
                    className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openDialog(font)}
                    disabled={saving}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[hsl(var(--glass-border))] bg-background text-lg leading-none"
                        style={previewStyle}
                        aria-hidden
                      >
                        Aa
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{font.name}</p>
                        {font.family ? (
                          <p className="truncate text-base leading-snug" style={previewStyle}>
                            {t('textPreviewSample')}
                          </p>
                        ) : (
                          <p className="truncate text-sm text-muted-foreground">{font.googleFontUrl}</p>
                        )}
                        {font.family ? (
                          <p className="truncate text-xs text-muted-foreground">{font.family}</p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={t('actionsFor', { name: font.name || t('fonts') })}>
                  <DropdownMenuItem onClick={() => openDialog(font)} disabled={saving}>
                    {tc('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => removeFont(font.id)}
                    disabled={saving}
                  >
                    {tc('delete')}
                  </DropdownMenuItem>
                </ItemListMenu>
              </ItemListItem>
            )
          })}
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
          onPersist({ ...theme, fonts: upsertById(theme.fonts, font) })
          setDialog(null)
        }}
      />
    </div>
  )
}
