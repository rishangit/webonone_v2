import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import { Button, CustomDialog, Form } from '@webonone/ui-kit'
import { getAddonModuleByType } from '../addons/registry'
import type { WebsiteAddon, WebsiteBreakpoint, WebsitePage, WebsiteTheme } from '../types'

export const ADDON_SETTINGS_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface AddonSettingsDialogProps {
  open: boolean
  addon: WebsiteAddon | null
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  onOpenChange: (open: boolean) => void
  onSave: (addon: WebsiteAddon) => void
}

export function AddonSettingsDialog({
  open,
  addon,
  breakpoint,
  theme,
  pages,
  onOpenChange,
  onSave,
}: AddonSettingsDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [draft, setDraft] = useState<WebsiteAddon | null>(addon)
  const [nestedDialogOpen, setNestedDialogOpen] = useState(false)
  const module = addon ? getAddonModuleByType(addon.type) : undefined
  const PropsFields = module?.PropsFields

  useEffect(() => {
    if (!open) {
      setNestedDialogOpen(false)
      return
    }
    setDraft(addon)
  }, [addon, open])

  function submit() {
    if (!draft) return
    onSave(draft)
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={module ? t(module.labelKey) : t('openSettings')}
      description={t('addonSettingsDescription')}
      icon={<Settings2 className="h-5 w-5" />}
      sizeWidth={ADDON_SETTINGS_DIALOG_SIZE.sizeWidth}
      sizeHeight={ADDON_SETTINGS_DIALOG_SIZE.sizeHeight}
      nestedDismissGuard={nestedDialogOpen}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={!draft}>
            {t('apply')}
          </Button>
        </>
      }
    >
      <Form className="space-y-4">
        {draft && PropsFields ? (
          <PropsFields
            addon={draft}
            breakpoint={breakpoint}
            theme={theme}
            pages={pages}
            onChange={setDraft}
            onNestedDialogOpenChange={setNestedDialogOpen}
          />
        ) : null}
      </Form>
    </CustomDialog>
  )
}
