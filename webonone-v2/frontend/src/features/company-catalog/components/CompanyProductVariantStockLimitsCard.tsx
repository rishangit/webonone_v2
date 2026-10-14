import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, EditableSectionCard, FormField, Input, ReadOnlyField, useToast } from '@webonone/ui-kit'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import {
  formValuesToStockLimitsPayload,
  productVariantStockLimitsFormSchema,
  stockLimitsToFormValues,
  type ProductVariantStockLimitsFormValues,
} from '@/features/company-catalog/schemas/productVariantStockLimitsSchemas'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'

type CompanyProductVariantStockLimitsCardProps = {
  companyProductId: string
  libraryVariantId: string
  canEdit: boolean
}

function formatLimitDisplay(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

export function CompanyProductVariantStockLimitsCard({
  companyProductId,
  libraryVariantId,
  canEdit,
}: CompanyProductVariantStockLimitsCardProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { byVariantId, loading, reload } = useCompanyProductVariantStockLimitsMap(companyProductId)
  const limits = byVariantId[libraryVariantId]
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState<ProductVariantStockLimitsFormValues>(() =>
    stockLimitsToFormValues(null, null),
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'minQuantity' | 'maxQuantity', string>>>(
    {},
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loading || editing) return
    setValues(stockLimitsToFormValues(limits?.minQuantity, limits?.maxQuantity))
    setFieldErrors({})
  }, [loading, editing, limits?.minQuantity, limits?.maxQuantity, libraryVariantId])

  function openEdit() {
    setValues(stockLimitsToFormValues(limits?.minQuantity, limits?.maxQuantity))
    setFieldErrors({})
    setEditing(true)
  }

  function handleCancel() {
    setValues(stockLimitsToFormValues(limits?.minQuantity, limits?.maxQuantity))
    setFieldErrors({})
    setEditing(false)
  }

  async function handleSave() {
    const parsed = productVariantStockLimitsFormSchema.safeParse(values)
    if (!parsed.success) {
      const next: Partial<Record<'minQuantity' | 'maxQuantity', string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'minQuantity' || key === 'maxQuantity') {
          next[key] = issue.message
        }
      }
      setFieldErrors(next)
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      const payload = formValuesToStockLimitsPayload(parsed.data)
      await companyCatalogApi.upsertProductVariantStockLimits(
        companyProductId,
        libraryVariantId,
        payload,
      )
      toast({ title: t('variantDetail.stockLimits.saved') })
      reload()
      setEditing(false)
    } catch (err) {
      toast({
        title: t('variantDetail.stockLimits.saveFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <EditableSectionCard
      title={t('variantDetail.stockLimits.title')}
      description={t('variantDetail.stockLimits.description')}
      canEdit={canEdit && !editing && !loading}
      onEdit={openEdit}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('variantDetail.stockLimits.loading')}</p>
      ) : editing ? (
        <div className="space-y-4">
          <FormField
            label={t('variantDetail.stockLimits.min')}
            htmlFor="variant-min-stock"
            error={fieldErrors.minQuantity}
          >
            <Input
              id="variant-min-stock"
              type="text"
              inputMode="decimal"
              className="tabular-nums"
              value={values.minQuantity}
              disabled={saving}
              placeholder="—"
              onChange={(e) => setValues((prev) => ({ ...prev, minQuantity: e.target.value }))}
            />
          </FormField>
          <FormField
            label={t('variantDetail.stockLimits.max')}
            htmlFor="variant-max-stock"
            error={fieldErrors.maxQuantity}
          >
            <Input
              id="variant-max-stock"
              type="text"
              inputMode="decimal"
              className="tabular-nums"
              value={values.maxQuantity}
              disabled={saving}
              placeholder="—"
              onChange={(e) => setValues((prev) => ({ ...prev, maxQuantity: e.target.value }))}
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
              {tc('save')}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={saving} onClick={handleCancel}>
              {tc('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ReadOnlyField
            label={t('variantDetail.stockLimits.min')}
            value={formatLimitDisplay(limits?.minQuantity)}
            valueClassName="tabular-nums"
          />
          <ReadOnlyField
            label={t('variantDetail.stockLimits.max')}
            value={formatLimitDisplay(limits?.maxQuantity)}
            valueClassName="tabular-nums"
          />
        </div>
      )}
    </EditableSectionCard>
  )
}
