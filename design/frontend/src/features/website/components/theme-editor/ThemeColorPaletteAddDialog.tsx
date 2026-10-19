import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, CustomDialog } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import type { WebsiteColorLibraryItem } from '../../types'
import { paletteToSwatches } from '../../utils/colorLibraryPalette'
import { ThemeColorLibraryPicker } from './ThemeColorLibraryPicker'

const DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

export function ThemeColorPaletteAddDialog({
  open,
  appliedLibraryPaletteIds,
  onOpenChange,
  onApply,
}: {
  open: boolean
  appliedLibraryPaletteIds: string[]
  onOpenChange: (open: boolean) => void
  onApply: (item: WebsiteColorLibraryItem) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setSelectedId(null)
  }, [open])

  const selected = colorLibrary.items.find((item) => item.id === selectedId) ?? null

  function handleApply() {
    if (!selected) return
    onApply(selected)
    onOpenChange(false)
  }

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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" onClick={handleApply} disabled={!selected}>
            {t('addThemeColorPalette')}
          </Button>
        </>
      }
    >
      <ThemeColorLibraryPicker
        appliedLibraryPaletteIds={appliedLibraryPaletteIds}
        selectedId={selectedId}
        onSelectId={setSelectedId}
        loadOnMount={open}
      />
      {selected ? (
        <p className="text-sm text-muted-foreground">
          {t('colorPaletteColorCount', { count: paletteToSwatches(selected.palette).length })}
        </p>
      ) : null}
    </CustomDialog>
  )
}
