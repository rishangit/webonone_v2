import { useTranslation } from 'react-i18next'
import { formatLibraryAttributeValueLabel } from '../services/dataLibraryApi'

export function VariantPickerItemDetails({
  sku,
  isDefault,
  values,
}: {
  sku: string
  isDefault?: boolean
  values: Array<{
    attributeName: string
    valueText: string | null
    valueNumber: number | null
    unitSymbol: string | null
  }>
}) {
  const { t } = useTranslation('catalog')
  const valueLine =
    values.length > 0
      ? values
          .map(
            (value) =>
              `${value.attributeName}: ${formatLibraryAttributeValueLabel(value, value.unitSymbol)}`,
          )
          .join(' · ')
      : null
  return (
    <>
      <p className="truncate text-sm text-muted-foreground">
        {t('variantsTab.sku', { sku })}
        {isDefault ? ` · ${t('variantDetail.variantCard.default')}` : ''}
      </p>
      {valueLine ? <p className="truncate text-sm text-muted-foreground">{valueLine}</p> : null}
    </>
  )
}
