import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, CustomDialog, mapZodIssuesToFieldErrors } from '@webonone/ui-kit'
import { websiteThemeEditorSchema } from '../../schemas/websiteThemeSchemas'
import type { WebsiteTheme } from '../../types'
import { normalizeWebsiteTheme } from '../../utils/websitePalette'
import { WEBSITE_PAGE_DIALOG_SIZE } from '../WebsiteEntityDialogs'
import { ThemeBasicSettingsBody } from './ThemeBasicSettingsBody'

export function ThemeBasicSettingsDialog({
  open,
  theme,
  onOpenChange,
  onSubmit,
  saving = false,
}: {
  open: boolean
  theme: WebsiteTheme
  onOpenChange: (open: boolean) => void
  onSubmit: (theme: WebsiteTheme) => boolean | void
  saving?: boolean
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState(theme)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const syncSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      syncSessionRef.current = null
      return
    }
    const sessionKey = theme.id
    if (syncSessionRef.current === sessionKey) return
    syncSessionRef.current = sessionKey
    setDraft(theme)
    setFieldErrors({})
  }, [open, theme])

  function handleSave() {
    const parsed = websiteThemeEditorSchema.safeParse({
      name: draft.name,
      colorPaletteId: draft.colorPaletteId?.trim() || '',
      pageBackgroundPaletteIndex: draft.pageBackgroundPaletteIndex,
      surfacePaletteIndex: draft.surfacePaletteIndex,
      bodyTextPaletteIndex: draft.bodyTextPaletteIndex,
      accent1PaletteIndex: draft.accent1PaletteIndex,
      accent2PaletteIndex: draft.accent2PaletteIndex,
      pageBackgroundIndex: draft.pageBackgroundIndex,
      surfaceIndex: draft.surfaceIndex,
      bodyTextIndex: draft.bodyTextIndex,
      accent1Index: draft.accent1Index,
      accent2Index: draft.accent2Index,
      fonts: theme.fonts,
      colorPalettes: theme.colorPalettes,
      textStyles: theme.textStyles,
      buttonStyles: theme.buttonStyles,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    const saved = onSubmit(
      normalizeWebsiteTheme({
        ...theme,
        ...draft,
        name: parsed.data.name,
        colorPaletteId: parsed.data.colorPaletteId,
        pageBackgroundPaletteIndex: parsed.data.pageBackgroundPaletteIndex,
        surfacePaletteIndex: parsed.data.surfacePaletteIndex,
        bodyTextPaletteIndex: parsed.data.bodyTextPaletteIndex,
        accent1PaletteIndex: parsed.data.accent1PaletteIndex,
        accent2PaletteIndex: parsed.data.accent2PaletteIndex,
        pageBackgroundIndex: parsed.data.pageBackgroundIndex,
        surfaceIndex: parsed.data.surfaceIndex,
        bodyTextIndex: parsed.data.bodyTextIndex,
        accent1Index: parsed.data.accent1Index,
        accent2Index: parsed.data.accent2Index,
        publishStatus: draft.publishStatus,
      }),
    )
    if (saved !== false) onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('editBasicSettingsTitle')}
      description={t('themeBasicSettingsCardDescription')}
      sizeWidth={WEBSITE_PAGE_DIALOG_SIZE.sizeWidth}
      sizeHeight="large"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" disabled={saving} onClick={handleSave}>
            {tc('save')}
          </Button>
        </>
      }
    >
      <ThemeBasicSettingsBody
        theme={draft}
        onChange={setDraft}
        fieldErrors={fieldErrors}
        mode="edit"
      />
    </CustomDialog>
  )
}
