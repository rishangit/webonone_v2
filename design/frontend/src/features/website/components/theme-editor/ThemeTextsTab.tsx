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
import { resolveTextStyle } from '../../document/theme'
import type { WebsiteTextStyle } from '../../types'
import { useThemeTextLibraryDownload } from '../../hooks/useThemeTextLibraryDownload'
import { writeThemeDraft } from '../../utils/themeDraftStorage'
import { applyThemeTokenPatch } from '../../utils/themeLibraryMaterialize'
import { upsertById } from '../../utils/upsertById'
import { WebsiteLibrarySourceTag } from '../WebsiteLibraryRevert'
import { ThemeEditorListHeader } from './ThemeEditorListHeader'
import { ThemeTextStyleDialog } from './ThemeTextStyleDialog'
import type { ThemeEditorTabProps } from './types'

type ThemeTextsTabProps = ThemeEditorTabProps & {
  onTextStyleInUse: () => void
}

export function ThemeTextsTab({ theme, onPersist, saving, onTextStyleInUse }: ThemeTextsTabProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { goToWebsite } = useNavigateDesign()
  const [dialog, setDialog] = useState<{ style?: WebsiteTextStyle } | null>(null)
  const download = useThemeTextLibraryDownload(theme, onPersist)

  function openCreateDialog() {
    writeThemeDraft(theme)
    setDialog({})
  }

  function openEditPage(style: WebsiteTextStyle) {
    writeThemeDraft(theme)
    goToWebsite(`/website/themes/${theme.id}/texts/${style.id}`)
  }

  function removeTextStyle(id: string) {
    if (theme.buttonStyles.some((style) => style.textStyleId === id)) {
      onTextStyleInUse()
      return
    }
    onPersist({ ...theme, textStyles: theme.textStyles.filter((style) => style.id !== id) })
  }

  return (
    <div className="space-y-2">
      <ThemeEditorListHeader
        title={t('texts')}
        addLabel={t('addTextStyle')}
        onAdd={() => openCreateDialog()}
        disabled={saving}
      />
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
                    onClick={() => openEditPage(style)}
                    disabled={saving}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{style.name}</p>
                      <WebsiteLibrarySourceTag sourceLibraryId={style.sourceLibraryId} />
                    </div>
                    <p
                      className="truncate text-base leading-snug"
                      style={{ fontFamily: snap.fontFamily, color: snap.color, fontSize: snap.size }}
                    >
                      {t('textPreviewSample')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[font?.name || font?.family, `${snap.size}px`].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                </ItemListContent>
                <ItemListMenu ariaLabel={t('actionsFor', { name: style.name || t('texts') })}>
                  <DropdownMenuItem onClick={() => openEditPage(style)} disabled={saving}>
                    {tc('edit')}
                  </DropdownMenuItem>
                  {style.sourceLibraryId && !theme.isLocked ? (
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
                    onClick={() => removeTextStyle(style.id)}
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
      <ThemeTextStyleDialog
        open={dialog !== null}
        theme={theme}
        initial={dialog?.style}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        onSubmit={(style, patch) => {
          const base = applyThemeTokenPatch(theme, patch)
          onPersist({ ...base, textStyles: upsertById(base.textStyles, style) })
          setDialog(null)
        }}
      />
      {download.dialog}
    </div>
  )
}
