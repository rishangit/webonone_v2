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
import { useProductListStockMeta } from '@/features/products/hooks/useProductListStockMeta'
import {
  formatProductListPrice,
  formatProductListStockAvailability,
  getActiveProductListLine,
  resolveProductListUnitPrice,
} from '@/features/products/utils/productListStockLine'
import { formatAttributeValueLabel } from '@/features/products/schemas/productVariantSchemas'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'

type ProductDetailVariantPricingCardProps = {
  productId: string
  canEdit: boolean
  onManageVariants: () => void
  showCompanyStock?: boolean
}

function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  return formatProductListPrice(value)
}

function VariantAttributeFields({
  values,
}: {
  values: Array<{
    attributeId: string
    attributeName: string
    attributeValueId: string
    valueText: string | null
    valueNumber: number | null
    unitSymbol: string | null
  }>
}) {
  if (values.length === 0) return null

  return (
    <div className="space-y-3 border-y border-border py-3">
      {values.map((value) => (
        <div key={`${value.attributeId}-${value.attributeValueId}`} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{value.attributeName}</p>
          <p className="text-sm text-foreground">
            {formatAttributeValueLabel(value, value.unitSymbol)}
          </p>
        </div>
      ))}
    </div>
  )
}

export function ProductDetailVariantPricingCard({
  productId,
  canEdit,
  onManageVariants,
  showCompanyStock = true,
}: ProductDetailVariantPricingCardProps) {
  const { t } = useTranslation('products')
  const stockByProductId = useProductListStockMeta([productId], showCompanyStock)
  const meta = stockByProductId[productId]
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

  const line = getActiveProductListLine(meta, selectedVariantId)
  const unitPrice = resolveProductListUnitPrice(line)
  const loading = meta === undefined
  const empty = meta !== undefined && meta.lines.length === 0

  return (
    <EditableSectionCard
      title={t('detailPricing.title')}
      description={t('detailPricing.description')}
      canEdit={canEdit}
      onEdit={onManageVariants}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('detailPricing.loading')}</p>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">{t('detailPricing.emptyVariants')}</p>
      ) : meta && line ? (
        <div className="space-y-4">
          {meta.variantCount > 1 ? (
            <FormField label={t('list.selectVariant')} htmlFor="product-detail-variant">
              <Select
                value={line.variantId}
                onValueChange={(variantId) => setSelectedVariantId(variantId)}
              >
                <SelectTrigger id="product-detail-variant" className="w-full max-w-md">
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

          {showCompanyStock ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t('list.stock')}</p>
              <StockAvailabilityProgress
                quantity={line.totalQuantity}
                caption={formatProductListStockAvailability(line.totalQuantity, t)}
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{t('list.price')}</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {formatMoney(unitPrice)}
            </p>
          </div>
        </div>
      ) : null}
    </EditableSectionCard>
  )
}
