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
import type { PublicProductVariantOffer } from '@/features/catalog/types/catalog.types'
import {
  formatPublicAttributeValueLabel,
  getActivePublicProductLine,
  resolvePublicProductUnitPrice,
} from '@/features/catalog/utils/publicProductVariantOffer'

type CatalogPublicProductVariantPricingCardProps = {
  offer: PublicProductVariantOffer | null
  loading: boolean
  listPriceFallback?: number | null
}

function VariantAttributeFields({
  values,
}: {
  values: PublicProductVariantOffer['lines'][number]['attributeValues']
}) {
  if (values.length === 0) return null

  return (
    <div className="space-y-3 border-y border-border py-3">
      {values.map((value) => (
        <ReadOnlyField
          key={`${value.attributeId}-${value.attributeValueId}`}
          label={value.attributeName}
          value={formatPublicAttributeValueLabel(value, value.unitSymbol)}
        />
      ))}
    </div>
  )
}

export function CatalogPublicProductVariantPricingCard({
  offer,
  loading,
  listPriceFallback,
}: CatalogPublicProductVariantPricingCardProps) {
  const { t } = useTranslation('search')
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>()

  useEffect(() => {
    if (!offer?.lines.length) {
      setSelectedVariantId(undefined)
      return
    }
    const defaultLine = offer.lines.find((line) => line.isDefault) ?? offer.lines[0]
    if (!defaultLine) return
    const stillValid = offer.lines.some((line) => line.variantId === selectedVariantId)
    if (!selectedVariantId || !stillValid) {
      setSelectedVariantId(defaultLine.variantId)
    }
  }, [offer, selectedVariantId])

  const line = getActivePublicProductLine(offer, selectedVariantId)
  const listPrice = offer?.listPrice ?? listPriceFallback ?? null
  const unitPrice = resolvePublicProductUnitPrice(line, listPrice)
  const empty = offer !== null && !offer.libraryUnavailable && offer.lines.length === 0

  return (
    <EditableSectionCard title={t('productPricing.title')} description={t('productPricing.description')}>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('productPricing.loading')}</p>
      ) : offer?.libraryUnavailable ? (
        <p className="text-sm text-muted-foreground">{t('productPricing.libraryUnavailable')}</p>
      ) : empty ? (
        <p className="text-sm text-muted-foreground">{t('productPricing.emptyVariants')}</p>
      ) : offer && line ? (
        <div className="space-y-4">
          {offer.variantCount > 1 ? (
            <FormField label={t('productPricing.variant')} htmlFor="public-product-detail-variant">
              <Select
                value={line.variantId}
                onValueChange={(variantId) => setSelectedVariantId(variantId)}
              >
                <SelectTrigger id="public-product-detail-variant" className="w-full">
                  <SelectValue placeholder={t('productPricing.variant')} />
                </SelectTrigger>
                <SelectContent>
                  {offer.lines.map((variantLine) => (
                    <SelectItem key={variantLine.variantId} value={variantLine.variantId}>
                      {variantLine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : (
            <ReadOnlyField label={t('productPricing.variant')} value={line.name} />
          )}

          <VariantAttributeFields values={line.attributeValues} />

          <ReadOnlyField
            label={t('productPricing.stock')}
            value={
              <StockAvailabilityProgress
                quantity={line.totalQuantity}
                caption={
                  line.totalQuantity > 0
                    ? t('productPricing.stockAvailable', { quantity: line.totalQuantity })
                    : t('productPricing.stockOut')
                }
              />
            }
          />

          {unitPrice != null ? (
            <ListPriceField label={t('productPricing.price')} value={unitPrice} />
          ) : null}
        </div>
      ) : null}
    </EditableSectionCard>
  )
}
