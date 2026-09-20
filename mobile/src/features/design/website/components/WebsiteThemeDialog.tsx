import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  ColorInput,
  CustomDialog,
  FormField,
  TextField,
} from '@webonone/mobile-ui'
import {
  addPaletteSlot,
  defaultWebsitePaletteTokens,
  pageChromeFromTokens,
  removePaletteSlot,
  updatePaletteSlot,
  WEBSITE_PALETTE_MAX,
  WEBSITE_PALETTE_MIN,
  WEBSITE_PALETTE_SLOT_NAME_KEYS,
  type WebsiteThemeCreateValues,
} from '@/features/design/website/utils/websitePalette'
import type { WebsiteColorToken } from '@/features/design/website/types'

export function WebsiteThemeDialog({
  open,
  isSaving,
  error,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: WebsiteThemeCreateValues) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const slotNames = WEBSITE_PALETTE_SLOT_NAME_KEYS.map((key) => t(key))
  const [name, setName] = useState('')
  const [slots, setSlots] = useState<WebsiteColorToken[]>(() => defaultWebsitePaletteTokens())

  useEffect(() => {
    if (!open) return
    setName('')
    setSlots(defaultWebsitePaletteTokens(slotNames))
  }, [open])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({
      name: trimmed,
      colors: slots,
      ...pageChromeFromTokens(slots),
    })
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createThemeTitle')}
      description={t('createThemeDescription')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={isSaving}>
            {tc('cancel')}
          </Button>
          <Button onPress={submit} disabled={isSaving || !name.trim()}>
            {isSaving ? t('creating') : t('create')}
          </Button>
        </>
      }
    >
      <View className="gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FormField label={t('name')} required>
          <TextField value={name} onChangeText={setName} editable={!isSaving} />
        </FormField>
        {slots.map((slot) => (
          <View key={slot.id} className="gap-2">
            <ColorInput
              label={slot.name}
              value={slot.value}
              onChange={(value) => setSlots((current) => updatePaletteSlot(current, slot.id, { value }))}
              disabled={isSaving}
            />
            {slots.length > WEBSITE_PALETTE_MIN ? (
              <Button
                variant="outline"
                size="sm"
                onPress={() => setSlots((current) => removePaletteSlot(current, slot.id))}
                disabled={isSaving}
              >
                {tc('delete')}
              </Button>
            ) : null}
          </View>
        ))}
        {slots.length < WEBSITE_PALETTE_MAX ? (
          <Button
            variant="outline"
            onPress={() => setSlots((current) => addPaletteSlot(current, slotNames))}
            disabled={isSaving}
          >
            {t('addColor')}
          </Button>
        ) : null}
      </View>
    </CustomDialog>
  )
}
