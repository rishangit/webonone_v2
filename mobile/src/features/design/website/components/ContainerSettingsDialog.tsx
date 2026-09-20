import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button, ColorInput, CustomDialog, FormField, TextField } from '@webonone/mobile-ui'
import type { WebsiteDocumentV1 } from '@/features/design/website/types'

export function ContainerSettingsDialog({
  open,
  document,
  onOpenChange,
  onChange,
}: {
  open: boolean
  document: WebsiteDocumentV1
  onOpenChange: (open: boolean) => void
  onChange: (next: WebsiteDocumentV1) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('containerSettingsTitle')}
      description={t('containerSettingsDescription')}
      sizeWidth="medium"
      sizeHeight="auto"
      footer={
        <Button onPress={() => onOpenChange(false)}>{tc('done')}</Button>
      }
    >
      <View className="gap-4">
        <FormField label={t('containerHeight')} hint={t('containerHeightHint')}>
          <TextField
            keyboardType="number-pad"
            value={String(document.container.height)}
            onChangeText={(value) => {
              const height = Number(value) || 0
              onChange({
                ...document,
                container: { ...document.container, height },
              })
            }}
          />
        </FormField>
        <ColorInput
          label={t('background')}
          value={document.container.backgroundColor ?? ''}
          onChange={(backgroundColor) =>
            onChange({
              ...document,
              container: { ...document.container, backgroundColor: backgroundColor || undefined },
            })
          }
        />
      </View>
    </CustomDialog>
  )
}
