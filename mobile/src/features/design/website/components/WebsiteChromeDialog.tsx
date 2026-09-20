import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  CustomDialog,
  FormField,
  TextField,
} from '@webonone/mobile-ui'

export function WebsiteChromeDialog({
  kind,
  open,
  isSaving,
  error,
  onOpenChange,
  onSubmit,
}: {
  kind: 'headers' | 'footers'
  open: boolean
  isSaving: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, isDefault: boolean) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setIsDefault(false)
  }, [open])

  const title = kind === 'headers' ? t('createHeaderTitle') : t('createFooterTitle')
  const description = kind === 'headers' ? t('createHeaderDescription') : t('createFooterDescription')

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed, isDefault)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      sizeWidth="medium"
      sizeHeight="auto"
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
        <Checkbox
          checked={isDefault}
          onCheckedChange={setIsDefault}
          disabled={isSaving}
          label={t('setDefault')}
        />
      </View>
    </CustomDialog>
  )
}
