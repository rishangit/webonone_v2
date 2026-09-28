import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  FormField,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import {
  catalogAttributeNumberValueSchema,
  catalogAttributeTextValueSchema,
} from '@/features/data/company-catalog/schemas/catalogAttributeValueSchemas'
import {
  dataLibraryApi,
  type LibraryCatalogAttribute,
  type LibraryAttributeValueEntry,
} from '@/features/sales/services/dataLibraryApi'
import type { CatalogKind } from '@/features/data/utils/dataPaths'

export function CompanyCatalogAttributeValueFormDialog({
  open,
  kind,
  libraryEntityId,
  attribute,
  value,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  kind: CatalogKind
  libraryEntityId: string
  attribute: LibraryCatalogAttribute
  value?: LibraryAttributeValueEntry | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const isEdit = Boolean(value)
  const [textValue, setTextValue] = useState('')
  const [numberValue, setNumberValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setFieldError(null)
    if (value) {
      setTextValue(value.valueText ?? '')
      setNumberValue(value.valueNumber != null ? String(value.valueNumber) : '')
    } else {
      setTextValue('')
      setNumberValue('')
    }
  }, [open, value])

  async function handleSave() {
    setFieldError(null)
    const galleryKind = kind as 'products' | 'services' | 'spaces'

    if (attribute.valueType === 'number') {
      const parsed = catalogAttributeNumberValueSchema.safeParse({ value: numberValue })
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message ?? tc('required'))
        return
      }
      setSaving(true)
      try {
        const body = { value_number: Number(parsed.data.value) }
        if (isEdit && value) {
          await dataLibraryApi.updateCatalogAttributeValue(galleryKind, libraryEntityId, value.id, body)
        } else {
          await dataLibraryApi.addCatalogAttributeValue(
            galleryKind,
            libraryEntityId,
            attribute.attributeId,
            body,
          )
        }
        toast({ title: tc('save') })
        onOpenChange(false)
        onSaved()
      } catch (err) {
        toast({
          title: tc('save'),
          description: err instanceof Error ? err.message : undefined,
          variant: 'destructive',
        })
      } finally {
        setSaving(false)
      }
      return
    }

    const parsed = catalogAttributeTextValueSchema.safeParse({ value: textValue })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? tc('required'))
      return
    }
    setSaving(true)
    try {
      const body = { value_text: parsed.data.value }
      if (isEdit && value) {
        await dataLibraryApi.updateCatalogAttributeValue(galleryKind, libraryEntityId, value.id, body)
      } else {
        await dataLibraryApi.addCatalogAttributeValue(
          galleryKind,
          libraryEntityId,
          attribute.attributeId,
          body,
        )
      }
      toast({ title: tc('save') })
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast({
        title: tc('save'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('attributeDetail.editValueTitle') : t('attributeDetail.addValueTitle')}
      description={attribute.name}
      footer={
        <View className="flex-row justify-end gap-2">
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button loading={saving} onPress={() => void handleSave()}>
            {tc('save')}
          </Button>
        </View>
      }
    >
      <FormField label={t('attributeDetail.definition.name')} required error={fieldError ?? undefined}>
        {attribute.valueType === 'number' ? (
          <TextField
            value={numberValue}
            onChangeText={setNumberValue}
            keyboardType="decimal-pad"
            placeholder={attribute.unit?.symbol ?? undefined}
          />
        ) : (
          <TextField value={textValue} onChangeText={setTextValue} />
        )}
      </FormField>
    </CustomDialog>
  )
}
