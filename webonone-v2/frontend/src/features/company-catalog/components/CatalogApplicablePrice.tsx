import { useTranslation } from 'react-i18next'
import { ListPriceField } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import type { CatalogPriceRule } from '@/features/company-catalog/types/catalogPriceRule.types'
import { formatCatalogPriceWhen } from '@/features/company-catalog/utils/formatCatalogPriceWhen'
import { resolveApplicableCatalogPrice } from '@/features/company-catalog/utils/resolveApplicableCatalogPrice'

type CatalogApplicablePriceProps = {
  rules: CatalogPriceRule[]
  loading?: boolean
}

export function CatalogApplicablePrice({ rules, loading = false }: CatalogApplicablePriceProps) {
  const { t } = useTranslation('catalog')
  const userId = useAppSelector((s) => s.auth.user?.id)
  const match = resolveApplicableCatalogPrice(rules, userId)

  const condition = loading
    ? t('priceList.loadingPrice')
    : match
      ? describeRule(match, t)
      : rules.length === 0
        ? t('priceList.noPrices')
        : t('priceList.noMatch')

  return (
    <div className="space-y-1">
      <ListPriceField label={t('priceList.currentPrice')} value={loading ? null : (match?.price ?? null)} />
      <p className="text-sm text-muted-foreground">{condition}</p>
    </div>
  )
}

function describeRule(
  rule: CatalogPriceRule,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const when = formatCatalogPriceWhen(rule, t)
  const whom =
    rule.applyTo === 'everyone'
      ? t('priceList.everyone')
      : t('priceList.userCount', { count: rule.users.length })
  return `${when} · ${whom}`
}
