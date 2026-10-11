import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StockAvailabilityProgress,
} from '@webonone/ui-kit'
import { useCompanyProductListStockMeta } from '@/features/company-catalog/hooks/useCompanyProductListStockMeta'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import {
  formatCompanyProductListStockAvailability,
  getActiveCompanyProductListLine,
  resolveCompanyProductListUnitPrice,
} from '@/features/company-catalog/utils/companyCatalogProductListStockLine'
import { EditableSectionCard } from '@/features/company-catalog/components/EditableSectionCard'
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

function formatLkr(value: number | null | undefined): string {
  if (value == null) return '—'
  return `LKR ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
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
        <div key={`${value.attributeId}-${value.attributeValueId}`} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{value.attributeName}</p>
          <p className="text-sm text-foreground">
            {formatLibraryAttributeValueLabel(value, value.unitSymbol)}
          </p>
        </div>
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
  const stockByLibraryId = useCompanyProductListStockMeta(libraryId ? [libraryId] : [])
  const meta = libraryId ? stockByLibraryId[libraryId] : undefined
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
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('list.selectVariant')}</p>
              <p className="text-sm">{line.name}</p>
            </div>
          )}

          <VariantAttributeFields values={line.attributeValues} />

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t('list.stock')}</p>
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('detail.variantPricing.minStock')}
              </p>
              <p className="text-sm tabular-nums">{formatStockLimit(stockLimits?.minQuantity)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t('detail.variantPricing.maxStock')}
              </p>
              <p className="text-sm tabular-nums">{formatStockLimit(stockLimits?.maxQuantity)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t('list.price')}</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">{formatLkr(unitPrice)}</p>
          </div>
        </div>
      ) : null}
    </EditableSectionCard>
  )
}
