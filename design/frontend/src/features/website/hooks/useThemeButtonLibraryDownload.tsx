import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { useToast } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteApi } from '../api'
import type { WebsiteButtonStyle, WebsiteTheme } from '../types'
import { applyThemeTokenPatch, materializeButtonLibraryItem } from '../utils/themeLibraryMaterialize'
import { upsertById } from '../utils/upsertById'

export function useThemeButtonLibraryDownload(
  theme: WebsiteTheme | null,
  persistTheme: (next: WebsiteTheme) => boolean | void,
) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [pending, setPending] = useState<WebsiteButtonStyle | null>(null)
  const [downloading, setDownloading] = useState(false)

  async function download(style: WebsiteButtonStyle) {
    if (!theme || !style.sourceLibraryId) return
    setDownloading(true)
    try {
      const item = await websiteApi.getButtonLibrary(style.sourceLibraryId)
      const { buttonStyle, patch } = materializeButtonLibraryItem(theme, item, {
        keepId: style.id,
        keepTextStyleId: style.textStyleId,
      })
      persistTheme({
        ...applyThemeTokenPatch(theme, patch),
        buttonStyles: upsertById(theme.buttonStyles, buttonStyle),
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
