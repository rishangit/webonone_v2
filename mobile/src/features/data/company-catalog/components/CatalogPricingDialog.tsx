import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  CustomDialog,
  FormField,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import type { CatalogEntityKind } from '@/features/sales/types/catalog.types'

export function CatalogPricingDialog({
  open,
  kind,
  id,
  listPrice,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  kind: CatalogEntityKind
  id: string
  listPrice: number | null | undefined
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const [value, setValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValue(listPrice == null ? '' : String(listPrice))
    setFieldError(null)
  }, [open, listPrice])

  async function handleSave() {
    const trimmed = value.trim()
    let parsed: number | null = null
    if (trimmed) {
      parsed = Number(trimmed)
      if (!Number.isFinite(parsed) || parsed < 0) {
        setFieldError('Enter a valid price of 0 or greater')
        return
      }
    }
    setFieldError(null)
    setSaving(true)
    try {
      await companyCatalogApi.updatePricing(kind, id, parsed)
      toast({ title: tc('save') })
      onOpenChange(false)
      onSaved?.()
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
      title="List price"
      description="Company selling price used as the Point of Sale default. Leave empty to set at checkout."
      sizeWidth="small"
      sizeHeight="auto"
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
            {tc('cancel')}
          </Button>
          <Button onPress={() => void handleSave()} disabled={saving}>
            {saving ? tc('loading') : tc('save')}
          </Button>
        </>
      }
    >
      <FormField label="List price (LKR)" error={fieldError ?? undefined}>
        <TextField
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          editable={!saving}
        />
      </FormField>
      {fieldError ? <Body className="text-destructive">{fieldError}</Body> : null}
    </CustomDialog>
  )
}
