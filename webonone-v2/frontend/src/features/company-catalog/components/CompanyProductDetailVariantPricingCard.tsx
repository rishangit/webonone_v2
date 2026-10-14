import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  EditableSectionCard,
  ListPriceField,
  ReadOnlyField,
  StockAvailabilityProgress,
} from '@webonone/ui-kit'
import { useCompanyProductListStockMeta } from '@/features/company-catalog/hooks/useCompanyProductListStockMeta'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import {
  formatCompanyProductListStockAvailability,
  getActiveCompanyProductListLine,
  resolveCompanyProductListUnitPrice,
} from '@/features/company-catalog/utils/companyCatalogProductListStockLine'
import {
  formatLibraryAttributeValueLabel,
  type LibraryProductVariantAttributeValue,
} from '@/features/company-catalog/services/dataLibraryApi'

type CompanyProductDetailVariantPricingCardProps = {
  companyProductId: string
  libraryProductId: string | null | undefined
  libraryUnavailable: boolean
  listPrice: number | null | undefined
  canEdit: boolean
  busy?: boolean
  onEditListPrice: () => void
}

function formatStockLimit(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

function VariantAttributeFields({ values }: { values: LibraryProductVariantAttributeValue[] }) {
  if (values.length === 0) return null

  return (
    <div className="space-y-3 border-y border-border py-3">
      {values.map((value) => (
        <ReadOnlyField
          key={`${value.attributeId}-${value.attributeValueId}`}
          label={value.attributeName}
          value={formatLibraryAttributeValueLabel(value, value.unitSymbol)}
        />
      ))}
    </div>
  )
}

export function CompanyProductDetailVariantPricingCard({
  companyProductId,
  libraryProductId,
  libraryUnavailable,
  listPrice,
  canEdit,
  busy = false,
  onEditListPrice,
}: CompanyProductDetailVariantPricingCardProps) {
  const { t } = useTranslation('catalog')
  const libraryId = libraryProductId?.trim() ? libraryProductId : ''
  const { byVariantId: stockLimitsByVariantId } = useCompanyProductVariantStockLimitsMap(companyProductId)
  const stockByProductId = useCompanyProductListStockMeta(
    libraryId ? [{ companyProductId, libraryProductId: libraryId }] : [],
  )
  const meta = libraryId ? stockByProductId[companyProductId] : undefined
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>()

  useEffect(() => {
    if (!meta?.lines.length) {
      setSelectedVariantId(undefined)
      return
    }
    const defaultLine = meta.lines.find((line) => line.isDefault) ?? meta.lines[0]
    if (!defaultLine) return
    const stillValid = meta.lines.some((line) => line.variantId === selectedVariantId)
    if (!selectedVariantId || !stillValid) {
      setSelectedVariantId(defaultLine.variantId)
    }
  }, [meta, selectedVariantId])

  const line = getActiveCompanyProductListLine(meta, selectedVariantId)
  const unitPrice = resolveCompanyProductListUnitPrice(line, listPrice)
  const stockLimits = line ? stockLimitsByVariantId[line.variantId] : undefined
  const loading = Boolean(libraryId) && !libraryUnavailable && meta === undefined
  const empty =
    Boolean(libraryId) && !libraryUnavailable && meta !== undefined && meta.lines.length === 0

  return (
    <EditableSectionCard
      title={t('detail.variantPricing.title')}
      description={t('detail.variantPricing.description')}
      canEdit={canEdit && !busy}
      onEdit={onEditListPrice}
    >
      {libraryUnavailable || !libraryId ? (
        <p className="text-sm text-muted-foreground">{t('detail.libraryItemUnavailable')}</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">{t('detail.variantPricing.loading')}</p>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">{t('detail.variantPricing.emptyVariants')}</p>
      ) : meta && line ? (
        <div className="space-y-4">
          {meta.variantCount > 1 ? (
            <FormField label={t('list.selectVariant')} htmlFor="company-product-detail-variant">
              <Select
                value={line.variantId}
                onValueChange={(variantId) => setSelectedVariantId(variantId)}
              >
                <SelectTrigger id="company-product-detail-variant" className="w-full max-w-md">
                  <SelectValue placeholder={t('list.selectVariant')} />
                </SelectTrigger>
                <SelectContent>
                  {meta.lines.map((variantLine) => (
                    <SelectItem key={variantLine.variantId} value={variantLine.variantId}>
                      {variantLine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : (
            <ReadOnlyField label={t('list.selectVariant')} value={line.name} />
          )}

          <VariantAttributeFields values={line.attributeValues} />

          <ReadOnlyField
            label={t('list.stock')}
            value={
              <StockAvailabilityProgress
                quantity={line.totalQuantity}
                maxQuantity={stockLimits?.maxQuantity}
                minQuantity={stockLimits?.minQuantity}
                caption={
                  stockLimits?.maxQuantity != null && stockLimits.maxQuantity > 0
                    ? undefined
                    : formatCompanyProductListStockAvailability(line.totalQuantity, t)
                }
              />
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField
              label={t('detail.variantPricing.minStock')}
              value={formatStockLimit(stockLimits?.minQuantity)}
              valueClassName="tabular-nums"
            />
            <ReadOnlyField
              label={t('detail.variantPricing.maxStock')}
              value={formatStockLimit(stockLimits?.maxQuantity)}
              valueClassName="tabular-nums"
            />
          </div>

          {unitPrice != null ? (
            <ListPriceField label={t('list.price')} value={unitPrice} />
          ) : null}
        </div>
      ) : null}
    </EditableSectionCard>
  )
}
