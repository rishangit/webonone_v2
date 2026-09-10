import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Plus } from 'lucide-react'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@webonone/ui-kit'
import { getAddonModules } from '../registry'
import type { WebsiteAddon, WebsiteDesignerKind, WebsitePreset } from '../../types'

export const ADD_ADDON_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

interface AddAddonDialogProps {
  open: boolean
  designerKind?: WebsiteDesignerKind
  presets?: WebsitePreset[]
  onOpenChange: (open: boolean) => void
  onAddonAdded: (type: WebsiteAddon['type']) => void
  onPresetAdded?: (preset: WebsitePreset) => void
}

export function AddAddonDialog({
  open,
  designerKind,
  presets = [],
  onOpenChange,
  onAddonAdded,
  onPresetAdded,
}: AddAddonDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [tab, setTab] = useState('addons')
  const [pendingType, setPendingType] = useState<WebsiteAddon['type'] | null>(null)
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null)
  const modules = getAddonModules(designerKind)

  useEffect(() => {
    if (open) setTab('addons')
  }, [open])

  function close() {
    setPendingType(null)
    setPendingPresetId(null)
    onOpenChange(false)
  }

  function selectAddon(type: WebsiteAddon['type']) {
    setPendingType(type)
    onAddonAdded(type)
    close()
  }

  function selectPreset(preset: WebsitePreset) {
    setPendingPresetId(preset.id)
    onPresetAdded?.(preset)
    close()
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPendingType(null)
          setPendingPresetId(null)
        } else {
          setTab('addons')
        }
        onOpenChange(next)
      }}
      title={t('addAddonTitle')}
      description={t('addAddonDescription')}
      icon={<Plus className="h-5 w-5" />}
      sizeWidth={ADD_ADDON_DIALOG_SIZE.sizeWidth}
      sizeHeight={ADD_ADDON_DIALOG_SIZE.sizeHeight}
      footer={
        <Button type="button" variant="outline" onClick={close}>
          {tc('close')}
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label={t('addAddonTabs')}>
          <TabsTrigger value="addons">{t('addonsTab')}</TabsTrigger>
          <TabsTrigger value="presets">{t('presetsTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="addons" className="mt-4">
          <ItemList>
            {modules.map((module) => {
              const isSelected = pendingType === module.type
              return (
                <ItemListItem
                  key={module.type}
                  role="button"
                  tabIndex={0}
                  className={`cursor-pointer ${isSelected ? itemListRowActiveClassName : ''}`}
                  aria-label={t(module.labelKey)}
                  aria-pressed={isSelected}
                  onClick={() => selectAddon(module.type)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectAddon(module.type)
                    }
                  }}
                >
                  <ItemListContent>
                    <p className="font-medium">{t(module.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(module.descriptionKey)}</p>
                  </ItemListContent>
                  {isSelected ? <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden /> : null}
                </ItemListItem>
              )
            })}
          </ItemList>
        </TabsContent>
        <TabsContent value="presets" className="mt-4">
          {presets.length === 0 ? (
            <ItemListEmpty>{t('emptyPresetsPicker')}</ItemListEmpty>
          ) : (
            <ItemList>
              {presets.map((preset) => {
                const isSelected = pendingPresetId === preset.id
                return (
                  <ItemListItem
                    key={preset.id}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer ${isSelected ? itemListRowActiveClassName : ''}`}
                    aria-label={preset.name}
                    aria-pressed={isSelected}
                    onClick={() => selectPreset(preset)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        selectPreset(preset)
                      }
                    }}
                  >
                    <ItemListContent>
                      <p className="font-medium">{preset.name}</p>
                    </ItemListContent>
                    {isSelected ? <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden /> : null}
                  </ItemListItem>
                )
              })}
            </ItemList>
          )}
        </TabsContent>
      </Tabs>
    </CustomDialog>
  )
}
