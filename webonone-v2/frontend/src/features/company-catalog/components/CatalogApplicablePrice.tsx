import { useTranslation } from 'react-i18next'
import { ListPriceField } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import type { CatalogDiscount, CatalogPrice } from '@/features/company-catalog/types/catalogPricing.types'
import {
  formatCatalogDiscountWhen,
  formatCatalogDiscountWhom,
  resolveApplicableCatalogOffer,
} from '@/features/company-catalog/utils/resolveApplicableCatalogPrice'

type CatalogApplicablePriceProps = {
  prices: CatalogPrice[]
  discounts: CatalogDiscount[]
  loading?: boolean
}

export function CatalogApplicablePrice({
  prices,
  discounts,
  loading = false,
}: CatalogApplicablePriceProps) {
  const { t, i18n } = useTranslation('catalog')
  const userId = useAppSelector((s) => s.auth.user?.id)
  const offer = resolveApplicableCatalogOffer(prices, discounts, userId)

  const condition = loading
    ? t('priceList.loadingPrice')
    : offer
      ? offer.discount
        ? `${formatCatalogDiscountWhen(offer.discount, t, i18n.language)} · ${formatCatalogDiscountWhom(offer.discount, t)}`
        : t('priceList.activePrice')
      : prices.length === 0
        ? t('priceList.noPrices')
        : t('priceList.noActivePrice')

  return (
    <div className="space-y-1">
      <ListPriceField
        label={t('priceList.currentPrice')}
        value={loading ? null : (offer?.price ?? null)}
        compareAt={loading || !offer?.discount ? null : offer.basePrice}
        discountPercent={loading ? null : (offer?.discount?.percent ?? null)}
      />
      <p className="text-sm text-muted-foreground">{condition}</p>
    </div>
  )
}
