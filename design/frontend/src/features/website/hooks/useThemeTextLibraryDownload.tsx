import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { useToast } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteApi } from '../api'
import type { WebsiteTextStyle, WebsiteTheme } from '../types'
import { applyThemeTokenPatch, materializeTextLibraryItem } from '../utils/themeLibraryMaterialize'
import { upsertById } from '../utils/upsertById'

export function useThemeTextLibraryDownload(
  theme: WebsiteTheme | null,
  persistTheme: (next: WebsiteTheme) => boolean | void,
) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [pending, setPending] = useState<WebsiteTextStyle | null>(null)
  const [downloading, setDownloading] = useState(false)

  async function download(style: WebsiteTextStyle) {
    if (!theme || !style.sourceLibraryId) return
    setDownloading(true)
    try {
      const item = await websiteApi.getTextLibrary(style.sourceLibraryId)
      const { textStyle, patch } = materializeTextLibraryItem(theme, item, { keepId: style.id })
      const next = applyThemeTokenPatch(theme, patch)
      persistTheme({
        ...next,
        textStyles: upsertById(next.textStyles, textStyle),
      })
    } catch (error) {
      toast({
        title: t('downloadUpdatedFromLibraryFailed'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setDownloading(false)
    }
  }

  const dialog = (
    <PlatformAlertConfirmDialog
      open={pending !== null}
      title={pending ? t('downloadUpdatedFromLibraryTitle', { name: pending.name }) : t('downloadUpdatedFromLibrary')}
      description={t('downloadUpdatedFromLibraryDescription')}
      submitLabel={t('downloadUpdatedFromLibrary')}
      cancelLabel={tc('cancel')}
      confirmDisabled={downloading}
      isAllowedParentOrigin={isAllowedParentOrigin}
      onOpenChange={(open) => {
        if (!open) setPending(null)
      }}
      onConfirm={() => {
        if (!pending) return
        void download(pending)
      }}
    />
  )

  return {
    ask: setPending,
    dialog,
    downloading,
  }
}
