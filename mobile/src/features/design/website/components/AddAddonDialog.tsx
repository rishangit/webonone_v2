import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Muted,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@webonone/mobile-ui'
import { addonTypesForKind } from '@/features/design/website/addons/defaults'
import type { WebsiteAddon, WebsiteDesignerKind, WebsitePreset } from '@/features/design/website/types'

export function AddAddonDialog({
  open,
  kind,
  presets,
  onOpenChange,
  onAddAddon,
  onAddPreset,
}: {
  open: boolean
  kind?: WebsiteDesignerKind
  presets: WebsitePreset[]
  onOpenChange: (open: boolean) => void
  onAddAddon: (type: WebsiteAddon['type']) => void
  onAddPreset: (preset: WebsitePreset) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [tab, setTab] = useState<'addons' | 'presets'>('addons')
  const types = addonTypesForKind(kind)

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('addAddonTitle')}
      description={t('addAddonDescription')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <Button variant="outline" onPress={() => onOpenChange(false)}>
          {tc('cancel')}
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as 'addons' | 'presets')}>
        <TabsList aria-label={t('addAddonTabs')}>
          <TabsTrigger value="addons">{t('addonsTab')}</TabsTrigger>
          <TabsTrigger value="presets">{t('presetsTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="addons">
          <View className="gap-2 pt-3">
            {types.map((type) => (
              <Button
                key={type}
                variant="outline"
                onPress={() => {
                  onAddAddon(type)
                  onOpenChange(false)
                }}
              >
                {t(type)}
              </Button>
            ))}
          </View>
        </TabsContent>
        <TabsContent value="presets">
          <View className="pt-3">
            {presets.length === 0 ? (
              <ItemListEmpty>{t('emptyPresets')}</ItemListEmpty>
            ) : (
              <ItemList>
                {presets.map((preset) => (
                  <ItemListItem key={preset.id}>
                    <Pressable
                      className="min-w-0 flex-1"
                      onPress={() => {
                        onAddPreset(preset)
                        onOpenChange(false)
                      }}
                    >
                      <ItemListContent title={preset.name} />
                    </Pressable>
                  </ItemListItem>
                ))}
              </ItemList>
            )}
            <Muted className="pt-2">{t('sliderPresetHint')}</Muted>
          </View>
        </TabsContent>
      </Tabs>
    </CustomDialog>
  )
}
