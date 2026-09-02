import { useTranslation } from 'react-i18next'
import { StatusTag } from '@webonone/ui-kit'
import type { ProductPickerStockDisplay } from '@/features/sales/utils/resolveProductPickerStockDisplay'

type PosPickerProductStockMetaProps = {
  meta: ProductPickerStockDisplay | null | undefined
}

export function PosPickerProductStockInline({ meta }: PosPickerProductStockMetaProps) {
  const { t } = useTranslation('sales')

  if (!meta) return null

  if (meta.variantCount <= 1) {
    const quantity = meta.lines[0]?.quantity ?? 0
    return <span>{t('pos.pickerStockAvailable', { quantity })}</span>
  }

  const defaultLine = meta.lines.find((line) => line.isDefault)

  return (
    <>
      <StatusTag variant="member" className="text-xs">
        {t('pos.pickerHasVariants')}
      </StatusTag>
      {defaultLine ? (
        <span>{t('pos.pickerStockAvailable', { quantity: defaultLine.quantity })}</span>
      ) : null}
    </>
  )
}
