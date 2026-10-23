import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { WebsiteColorLibraryItem } from '../../types'
import { paletteToSwatches } from '../../utils/colorLibraryPalette'
import { parseLibraryPaletteApplyPayload } from '../../utils/websitePalette'
import { ThemeColorLibraryPicker } from './ThemeColorLibraryPicker'

const DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

function themeColorPaletteAddPath(themeId: string): string {
  return `/embed/dialogs/website/themes/${encodeURIComponent(themeId)}/palettes/add`
}

export function ThemeColorPaletteAddDialog({
  open,
  themeId,
  appliedLibraryPaletteIds,
  onOpenChange,
  onApply,
  chrome = 'dialog',
}: {
  open: boolean
  themeId: string
  appliedLibraryPaletteIds: string[]
  onOpenChange: (open: boolean) => void
  onApply: (item: WebsiteColorLibraryItem) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: themeColorPaletteAddPath(themeId),
    title: t('addThemeColorPaletteTitle'),
    description: t('addColorPaletteLibraryHint'),
    submitLabel: t('addThemeColorPalette'),
    ...DIALOG_SIZE,
    onResult: (payload) => {
      const paletteApply = parseLibraryPaletteApplyPayload(payload)
      if (paletteApply?.sourceLibraryPaletteId && paletteApply.paletteName) {
        const fromStore = colorLibrary.items.find((entry) => entry.id === paletteApply.sourceLibraryPaletteId)
        if (fromStore) {
          onApply(fromStore)
        } else {
          onApply({
            id: paletteApply.sourceLibraryPaletteId,
            name: paletteApply.paletteName,
            publishStatus: 'published',
            sortOrder: 0,
            palette: {
              colors: paletteApply.swatches.map((value, index) => ({
                name: paletteApply.colorNames[index] ?? '',
                value,
              })),
            },
          })
        }
      }
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    if (!open) setSelectedId(null)
  }, [chrome, open])

  const selected = colorLibrary.items.find((item) => item.id === selectedId) ?? null

  function handleApply() {
    if (!selected) return
    if (dialogRequestId && parentOrigin) {
      sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId, {
        kind: 'libraryPalette',
        swatches: paletteToSwatches(selected.palette),
        colorNames: selected.palette.colors.map((entry) => entry.name),
        sourceLibraryPaletteId: selected.id,
        paletteName: selected.name,
      })
      return
    }
    onApply(selected)
    onOpenChange(false)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: handleApply,
  })

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, !selected)
  }, [dialogRequestId, parentOrigin, selected])

  const body = (
    <>
      <ThemeColorLibraryPicker
        appliedLibraryPaletteIds={appliedLibraryPaletteIds}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        loadOnMount={open || chrome === 'embed-page'}
      />
      {selected ? (
        <p className="text-sm text-muted-foreground">
          {t('colorPaletteColorCount', { count: paletteToSwatches(selected.palette).length })}
        </p>
      ) : null}
    </>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('addThemeColorPaletteTitle')}
      description={t('addColorPaletteLibraryHint')}
      sizeWidth={DIALOG_SIZE.sizeWidth}
      sizeHeight={DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" disabled={!selected} onClick={handleApply}>
            {t('addThemeColorPalette')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}
