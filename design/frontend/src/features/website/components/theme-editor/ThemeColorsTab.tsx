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

import type { WebsiteColorToken } from '../../types'

import { pageChromeFromTokens, mergeImportedSwatches, WEBSITE_PALETTE_SLOT_NAME_KEYS } from '../../utils/websitePalette'

import { writeThemeDraft } from '../../utils/themeDraftStorage'

import { upsertById } from '../../utils/upsertById'

import { ThemeColorDialog } from './ThemeColorDialog'

import { ThemeCssImportDialog } from './ThemeCssImportDialog'

import { ThemeEditorListHeader } from './ThemeEditorListHeader'

import { ThemePaletteImportCallout } from './ThemePaletteImportCallout'

import type { ThemeEditorTabProps } from './types'



type ThemeColorsTabProps = ThemeEditorTabProps & {

  onColorInUse: () => void

}



export function ThemeColorsTab({ theme, onPersist, saving, onColorInUse }: ThemeColorsTabProps) {

  const { t } = useTranslation('website')

  const { t: tc } = useTranslation('common')

  const [dialog, setDialog] = useState<{ color?: WebsiteColorToken } | null>(null)

  const [importOpen, setImportOpen] = useState(false)



  function openDialog(color?: WebsiteColorToken) {

    writeThemeDraft(theme)

    setDialog({ color })

  }



  function removeColor(id: string) {

    const usedByText = theme.textStyles.some((style) => style.colorId === id)

    const usedByButton = theme.buttonStyles.some(

      (style) =>

        style.backgroundColorId === id || style.textColorId === id || style.borderColorId === id,

    )

    if (usedByText || usedByButton) {

      onColorInUse()

      return

    }

    onPersist({ ...theme, colors: theme.colors.filter((item) => item.id !== id) })

  }



  return (

    <div className="space-y-4">

      <ThemeEditorListHeader

        title={t('colors')}

        addLabel={t('addColor')}

        onAdd={() => openDialog()}

        disabled={saving}

      />

      <ThemePaletteImportCallout

        disabled={saving}

        onOpenImport={() => {

          writeThemeDraft(theme)

          setImportOpen(true)

        }}

      />

      {theme.colors.length === 0 ? (

        <ItemListEmpty>{t('emptyColors')}</ItemListEmpty>

      ) : (

        <ItemList>

          {theme.colors.map((color) => (

            <ItemListItem key={color.id}>

              <ItemListContent>

                <button

                  type="button"

                  className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"

                  onClick={() => openDialog(color)}

                  disabled={saving}

                >

                  <div className="flex items-center gap-3">

                    <span

                      className="h-8 w-8 shrink-0 rounded-md border border-[hsl(var(--glass-border))]"

                      style={{ backgroundColor: color.value }}

                      aria-hidden

                    />

                    <div>

                      <p className="font-medium">{color.name}</p>

                      <p className="text-sm text-muted-foreground">{color.value}</p>

                    </div>

                  </div>

                </button>

              </ItemListContent>

              <ItemListMenu ariaLabel={t('actionsFor', { name: color.name || t('colors') })}>

                <DropdownMenuItem onClick={() => openDialog(color)} disabled={saving}>

                  {tc('edit')}

                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem

                  className="text-destructive focus:text-destructive"

                  onClick={() => removeColor(color.id)}

                  disabled={saving}

                >

                  {tc('delete')}

                </DropdownMenuItem>

              </ItemListMenu>

            </ItemListItem>

          ))}

        </ItemList>

      )}

      <ThemeColorDialog

        open={dialog !== null}

        themeId={theme.id}

        initial={dialog?.color}

        onOpenChange={(open) => {

          if (!open) setDialog(null)

        }}

        onSubmit={(color) => {

          onPersist({ ...theme, colors: upsertById(theme.colors, color) })

          setDialog(null)

        }}

      />

      <ThemeCssImportDialog

        open={importOpen}

        onOpenChange={setImportOpen}

        onImport={(swatches) => {

          const usedIds = new Set(

            [

              ...theme.textStyles.map((style) => style.colorId),

              ...theme.buttonStyles.flatMap((style) => [

                style.backgroundColorId,

                style.textColorId,

                style.borderColorId,

              ]),

            ].filter(Boolean),

          )

          const names = WEBSITE_PALETTE_SLOT_NAME_KEYS.map((key) => t(key))

          const colors = mergeImportedSwatches(swatches, theme.colors, names, usedIds)

          onPersist({

            ...theme,

            colors,

            ...pageChromeFromTokens(colors),

          })

          setImportOpen(false)

        }}

      />

    </div>

  )

}


