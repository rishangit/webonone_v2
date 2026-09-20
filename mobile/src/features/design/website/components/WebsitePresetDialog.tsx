import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  TextField,
} from '@webonone/mobile-ui'

export function WebsitePresetDialog({
  open,
  isSaving,
  error,
  entityId,
  initialName,
  saveAs,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  isSaving: boolean
  error: string | null
  entityId?: string
  initialName?: string
  saveAs?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [name, setName] = useState('')
  const isEdit = Boolean(entityId)
  const isSaveAs = Boolean(saveAs)
  const title = isSaveAs ? t('saveAsPresetTitle') : isEdit ? t('editPresetTitle') : t('createPresetTitle')
  const description = isSaveAs
    ? t('saveAsPresetDescription')
    : isEdit
      ? t('editPresetDescription')
      : t('createPresetDescription')
  const submitLabel = isSaveAs ? t('saveAsPreset') : isEdit ? tc('save') : t('create')

  useEffect(() => {
    if (!open) return
    setName(initialName ?? '')
  }, [open, initialName])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
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
            {isSaving ? t('saving') : submitLabel}
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
      </View>
    </CustomDialog>
  )
}
