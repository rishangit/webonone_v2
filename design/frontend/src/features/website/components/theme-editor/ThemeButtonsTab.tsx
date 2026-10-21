import { useState } from 'react'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
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
import { useThemeButtonLibraryDownload } from '../../hooks/useThemeButtonLibraryDownload'
import { writeThemeDraft } from '../../utils/themeDraftStorage'
import { applyThemeTokenPatch } from '../../utils/themeLibraryMaterialize'
import { upsertById } from '../../utils/upsertById'
import { WebsiteLibrarySourceTag } from '../WebsiteLibraryRevert'
import { ThemeButtonStyleDialog } from './ThemeButtonStyleDialog'
import { ThemeEditorListHeader } from './ThemeEditorListHeader'
import type { ThemeEditorTabProps } from './types'

export function ThemeButtonsTab({ theme, onPersist, saving }: ThemeEditorTabProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { goToWebsite } = useNavigateDesign()
  const [dialog, setDialog] = useState<{ style?: WebsiteButtonStyle } | null>(null)
  const download = useThemeButtonLibraryDownload(theme, onPersist)

  function openCreateDialog() {
    writeThemeDraft(theme)
    setDialog({})
  }

  function openEditPage(style: WebsiteButtonStyle) {
    writeThemeDraft(theme)
    goToWebsite(`/website/themes/${theme.id}/buttons/${style.id}`)
  }

  function removeButtonStyle(id: string) {
    onPersist({
      ...theme,
      buttonStyles: theme.buttonStyles.filter((style) => style.id !== id),
    })
  }

  return (
    <div className="space-y-2">
      <ThemeEditorListHeader
        title={t('buttons')}
        addLabel={t('addButtonStyle')}
        onAdd={() => openCreateDialog()}
        disabled={saving}
      />
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
                    onClick={() => openEditPage(style)}
                    disabled={saving}
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
                    <WebsiteLibrarySourceTag sourceLibraryId={style.sourceLibraryId} />
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={t('actionsFor', { name: style.name || t('buttons') })}>
                  <DropdownMenuItem onClick={() => openEditPage(style)} disabled={saving}>
                    {tc('edit')}
                  </DropdownMenuItem>
                  {style.sourceLibraryId ? (
                    <DropdownMenuItem
                      disabled={saving || download.downloading}
                      onClick={() => download.ask(style)}
                    >
                      {t('downloadUpdatedFromLibrary')}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => removeButtonStyle(style.id)}
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
      <ThemeButtonStyleDialog
        open={dialog !== null}
        theme={theme}
        initial={dialog?.style}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={(style, patch) => {
          const base = applyThemeTokenPatch(theme, patch)
          if (!onPersist({ ...base, buttonStyles: upsertById(base.buttonStyles, style) })) {
            return
          }
          setDialog(null)
        }}
      />
      {download.dialog}
    </div>
  )
}
