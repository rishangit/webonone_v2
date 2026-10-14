import { useTranslation } from 'react-i18next'
import { EditableSectionCard, ReadOnlyField, StatusTag, StockAvailabilityProgress } from '@webonone/ui-kit'
import { useCompanyProductVariantStockLimitsMap } from '@/features/company-catalog/hooks/useCompanyProductVariantStockLimitsMap'
import type { LibraryProductVariant } from '@/features/company-catalog/services/dataLibraryApi'

type CompanyProductVariantSummaryCardProps = {
  variant: LibraryProductVariant
  companyProductId: string
  totalQuantity: number
  stocksLoading: boolean
}

export function CompanyProductVariantSummaryCard({
  variant,
  companyProductId,
  totalQuantity,
  stocksLoading,
}: CompanyProductVariantSummaryCardProps) {
  const { t } = useTranslation('catalog')
  const { byVariantId } = useCompanyProductVariantStockLimitsMap(companyProductId)
  const limits = byVariantId[variant.id]

  return (
    <EditableSectionCard
      title={t('variantDetail.variantCard.title')}
      description={t('variantDetail.variantCard.description')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{variant.name}</h2>
        {variant.isDefault ? (
          <StatusTag variant="verified" className="shrink-0">
            {t('variantDetail.variantCard.default')}
          </StatusTag>
        ) : null}
      </div>
      <ReadOnlyField label={t('variantDetail.variantCard.sku')} value={variant.sku} />
      <ReadOnlyField
        className="border-t border-border pt-4"
        label={t('stocks.totalAvailability')}
        value={
          stocksLoading ? (
            t('stocks.loading')
          ) : (
            <StockAvailabilityProgress
              quantity={totalQuantity}
              maxQuantity={limits?.maxQuantity}
              minQuantity={limits?.minQuantity}
            />
          )
        }
      />
    </EditableSectionCard>
  )
}
