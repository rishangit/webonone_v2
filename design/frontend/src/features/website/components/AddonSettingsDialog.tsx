import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import {
  Button,
  CustomDialog,
  Form,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { getAddonModuleByType } from '../addons/registry'
import { findBlockPath } from '../document/blockTree'
import { pickElementChrome } from '../document/chrome'
import { findNearestDatasetBinding } from '../document/dataBinding'
import type {
  ElementChrome,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDocumentV1,
  WebsitePage,
  WebsiteTheme,
} from '../types'
import { AddonDataBindingFields } from './AddonDataBindingFields'
import { ElementChromeSettingsFields } from './ElementChromeSettingsFields'

export const ADDON_SETTINGS_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface AddonSettingsDialogProps {
  open: boolean
  addon: WebsiteAddon | null
  blockId: string | null
  document: WebsiteDocumentV1
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  /** Prefer this dataset id (e.g. slider.props.datasetId) over ancestor block binding. */
  datasetIdOverride?: string | null
  /**
   * When the addon sits under a parent-path nested slider, scope field options to
   * that array/object item (e.g. galleryImages → url / fileId).
   */
  fieldPathPrefix?: string | null
  onOpenChange: (open: boolean) => void
  onSave: (addon: WebsiteAddon) => void
}

export function AddonSettingsDialog({
  open,
  addon,
  blockId,
  document,
  breakpoint,
  theme,
  pages,
  datasetIdOverride,
  fieldPathPrefix = null,
  onOpenChange,
  onSave,
}: AddonSettingsDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const datasets = useAppSelector((s) => s.websiteDatasets.items)
  const [tab, setTab] = useState('basic')
  const [draft, setDraft] = useState<WebsiteAddon | null>(addon)
  const [nestedDialogOpen, setNestedDialogOpen] = useState(false)
  const module = addon ? getAddonModuleByType(addon.type) : undefined
  const PropsFields = module?.PropsFields
  const DataBindingFields = module?.DataBindingFields

  const nearestDataset = useMemo(() => {
    if (datasetIdOverride) {
      return datasets.find((item) => item.id === datasetIdOverride) ?? null
    }
    if (!blockId) return null
    const path = findBlockPath(document, blockId)
    const binding = findNearestDatasetBinding(path)
    if (!binding) return null
    return datasets.find((item) => item.id === binding.datasetId) ?? null
  }, [blockId, datasetIdOverride, datasets, document])

  useEffect(() => {
    if (!open) {
      setNestedDialogOpen(false)
      return
    }
    setTab('basic')
    setDraft(addon)
  }, [addon, open])

  function submit() {
    if (!draft) return
    onSave(draft)
    onOpenChange(false)
  }

  function updateChrome(chrome: ElementChrome) {
    if (!draft) return
    setDraft({
      ...draft,
      backgroundColor: chrome.backgroundColor,
      borderColor: chrome.borderColor,
      borderRadius: chrome.borderRadius,
      boxShadow: chrome.boxShadow,
      padding: chrome.padding,
      margin: chrome.margin,
    })
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
        {draft ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList aria-label={t('addonSettingsDescription')}>
              <TabsTrigger value="basic">{t('basicSetting')}</TabsTrigger>
              <TabsTrigger value="settings">{t('settingsTab')}</TabsTrigger>
              <TabsTrigger value="dataBinding">{t('dataBindingTab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              {PropsFields ? (
                <PropsFields
                  addon={draft}
                  breakpoint={breakpoint}
                  theme={theme}
                  pages={pages}
                  onChange={setDraft}
                  onNestedDialogOpenChange={setNestedDialogOpen}
                />
              ) : null}
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <ElementChromeSettingsFields
                value={pickElementChrome(draft)}
                onChange={updateChrome}
                idPrefix="addon-settings"
              />
            </TabsContent>
            <TabsContent value="dataBinding" className="space-y-4">
              {DataBindingFields ? (
                <DataBindingFields
                  addon={draft}
                  breakpoint={breakpoint}
                  theme={theme}
                  pages={pages}
                  onChange={setDraft}
                  onNestedDialogOpenChange={setNestedDialogOpen}
                  inheritedFromParent={Boolean(datasetIdOverride)}
                  parentDataset={nearestDataset}
                />
              ) : (
                <AddonDataBindingFields
                  addon={draft}
                  dataset={nearestDataset}
                  inheritedFromParent={Boolean(datasetIdOverride)}
                  fieldPathPrefix={fieldPathPrefix}
                  onChange={setDraft}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </Form>
    </CustomDialog>
  )
}
