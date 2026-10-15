import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, CustomDialog, Form, FormField, Input, useToast } from '@webonone/ui-kit'
import { companyCatalogApi } from '../services/companyCatalogApi'
import {
  catalogAttributeNumberValueSchema,
  catalogAttributeTextValueSchema,
} from '../schemas/catalogAttributeValueSchemas'
import type { CatalogGalleryKind } from '../types/companyCatalog.types'

type CompanyCatalogAttributeValueEditDialogProps = {
  open: boolean
  kind: CatalogGalleryKind
  entityId: string
  valueId: string
  valueType: 'number' | 'text'
  initialText: string | null
  initialNumber: number | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function CompanyCatalogAttributeValueEditDialog({
  open,
  kind,
  entityId,
  valueId,
  valueType,
  initialText,
  initialNumber,
  onOpenChange,
  onSaved,
}: CompanyCatalogAttributeValueEditDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [value, setValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setFieldError(null)
    setValue(valueType === 'number' ? (initialNumber != null ? String(initialNumber) : '') : (initialText ?? ''))
  }, [initialNumber, initialText, open, valueType])

  async function handleSave() {
    const parsed =
      valueType === 'number'
        ? catalogAttributeNumberValueSchema.safeParse({ value })
        : catalogAttributeTextValueSchema.safeParse({ value })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? tc('required'))
      return
    }
    setSaving(true)
    setFieldError(null)
    try {
      await companyCatalogApi.updateCopiedAttributeValue(
        kind,
        entityId,
        valueId,
        valueType === 'number'
          ? { valueNumber: Number(parsed.data.value), valueText: null }
          : { valueText: parsed.data.value, valueNumber: null },
      )
      toast({ title: t('attributeDetail.valueUpdated') })
      onSaved()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('attributeDetail.updateValueFailed')
      setFieldError(message)
      toast({ title: t('attributeDetail.updateValueFailed'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('attributeDetail.editValueTitle')}
      description={t('attributeDetail.editValueDescription')}
      sizeWidth="small"
      sizeHeight="auto"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10" disabled={saving} onClick={() => void handleSave()}>
            {tc('save')}
          </Button>
        </>
      }
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          void handleSave()
        }}
      >
        <FormField label={t('attributeDetail.valueLabel')} htmlFor="company-attribute-value" error={fieldError ?? undefined} required>
          <Input
            id="company-attribute-value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode={valueType === 'number' ? 'decimal' : 'text'}
          />
        </FormField>
      </Form>
    </CustomDialog>
  )
}
