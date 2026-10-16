import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ListPriceField,
  ReadOnlyField,
} from '@webonone/ui-kit'
import { CompanyCatalogListItemStockProgress } from '@/features/company-catalog/components/CompanyCatalogListItemStockProgress'
import { useCompanyProductListStockMeta } from '@/features/company-catalog/hooks/useCompanyProductListStockMeta'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import { getActiveCompanyProductListLine } from '@/features/company-catalog/utils/companyCatalogProductListStockLine'
import {
  formatLibraryAttributeValueLabel,
  type LibraryProductVariantAttributeValue,
} from '@/features/company-catalog/services/dataLibraryApi'

type CompanyProductDetailVariantPricingCardProps = {
  companyProductId: string
  libraryProductId: string | null | undefined
  libraryUnavailable: boolean
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
  const unitPrice = line?.sellPrice ?? null
  const stockLimits = line ? stockLimitsByVariantId[line.variantId] : undefined
  const loading = Boolean(libraryId) && !libraryUnavailable && meta === undefined
  const empty =
    Boolean(libraryId) && !libraryUnavailable && meta !== undefined && meta.lines.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('detail.variantPricing.title')}</CardTitle>
        <CardDescription>{t('detail.variantPricing.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-label">
                {t('list.stock')}
              </p>
              <CompanyCatalogListItemStockProgress
                companyProductId={companyProductId}
                variantId={line.variantId}
                quantity={line.totalQuantity}
                align="start"
              />
            </div>

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
              <ListPriceField
                label={t('list.price')}
                value={unitPrice}
                compareAt={line.compareAtSellPrice}
                discountPercent={line.discountPercent}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
