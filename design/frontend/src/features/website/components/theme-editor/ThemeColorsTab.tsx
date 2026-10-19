import { useMemo, useState } from 'react'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListEmpty,
  ItemListMenu,
} from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { ColorPaletteHubListItem } from '../ColorPaletteHubListItem'
import type { WebsiteColorLibraryItem } from '../../types'
import {
  applyLibraryPaletteGroupToTheme,
  removeThemeColorPaletteGroup,
  themePaletteRefsToLibraryPalette,
} from '../../utils/websitePalette'
import { writeThemeDraft } from '../../utils/themeDraftStorage'
import { ThemeColorPaletteAddDialog } from './ThemeColorPaletteAddDialog'
import { ThemeEditorListHeader } from './ThemeEditorListHeader'
import type { ThemeEditorTabProps } from './types'

export function ThemeColorsTab({ theme, onPersist, saving }: ThemeEditorTabProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { goToWebsite } = useNavigateDesign()
  const [paletteDialogOpen, setPaletteDialogOpen] = useState(false)

  const colorPalettes = theme.colorPalettes ?? []
  const appliedLibraryPaletteIds = useMemo(
    () =>
      (theme.colorPalettes ?? [])
        .map((palette) => palette.sourceLibraryPaletteId)
        .filter((id): id is string => Boolean(id)),
    [theme.colorPalettes],
  )
  const colorsById = useMemo(() => new Map(theme.colors.map((color) => [color.id, color])), [theme.colors])

  function applyLibraryItem(item: WebsiteColorLibraryItem) {
    const entries = item.palette.colors.map((entry) => ({ name: entry.name, value: entry.value }))
    onPersist({
      ...theme,
      ...applyLibraryPaletteGroupToTheme(theme, {
        name: item.name,
        sourceLibraryPaletteId: item.id,
        entries,
      }),
    })
  }

  function removePalette(paletteInstanceId: string) {
    onPersist({ ...theme, ...removeThemeColorPaletteGroup(theme, paletteInstanceId) })
  }

  const hasPalettes = colorPalettes.length > 0

  return (
    <div className="space-y-2">
      <ThemeEditorListHeader
        title={t('colors')}
        addLabel={t('addThemeColorPalette')}
        onAdd={() => {
          writeThemeDraft(theme)
          setPaletteDialogOpen(true)
        }}
        disabled={saving}
      />

      {!hasPalettes ? (
        <ItemListEmpty>{t('emptyThemeColorPalettes')}</ItemListEmpty>
      ) : (
        <ItemList>
          {colorPalettes.map((paletteRef) => {
            const palette = themePaletteRefsToLibraryPalette(paletteRef, colorsById)
            const detailPath = `/website/themes/${theme.id}/palettes/${paletteRef.id}`
            return (
              <ColorPaletteHubListItem
                key={paletteRef.id}
                name={paletteRef.name}
                palette={palette}
                colorCountLabel={t('colorPaletteColorCount', { count: palette.colors.length })}
                onOpen={() => goToWebsite(detailPath)}
                menu={
                  <ItemListMenu ariaLabel={t('actionsFor', { name: paletteRef.name })}>
                    <DropdownMenuItem disabled={saving} onClick={() => goToWebsite(detailPath)}>
                      {tc('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => removePalette(paletteRef.id)}
                      disabled={saving}
                    >
                      {tc('delete')}
                    </DropdownMenuItem>
                  </ItemListMenu>
                }
              />
            )
          })}
        </ItemList>
      )}

      <ThemeColorPaletteAddDialog
        open={paletteDialogOpen}
        appliedLibraryPaletteIds={appliedLibraryPaletteIds}
        onOpenChange={setPaletteDialogOpen}
        onApply={applyLibraryItem}
      />
    </div>
  )
}
