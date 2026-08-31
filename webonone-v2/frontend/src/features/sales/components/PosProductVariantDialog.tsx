import { useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  itemListRowActiveClassName,
  cn,
} from '@webonone/ui-kit'
import { formatLkr } from '@/features/sales/utils/formatMoney'
import type { StockedProductVariantOption } from '@/features/sales/utils/resolveStockedProductVariants'

type PosProductVariantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName: string
  options: StockedProductVariantOption[]
  onConfirm: (selection: StockedProductVariantOption) => void
}

export function PosProductVariantDialog({
  open,
  onOpenChange,
  productName,
  options,
  onConfirm,
}: PosProductVariantDialogProps) {
  const { t } = useTranslation('sales')
  const { t: tc } = useTranslation('common')
  const [selected, setSelected] = useState<StockedProductVariantOption | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setSelected(null)
    onOpenChange(next)
  }

  function handleConfirm() {
    if (!selected) return
    onConfirm(selected)
    setSelected(null)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('pos.variantPickerTitle')}
      description={t('pos.variantPickerDescription', { name: productName })}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => handleOpenChange(false)}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10" disabled={!selected} onClick={handleConfirm}>
            {t('pos.variantPickerAdd')}
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <ItemListEmpty>{t('pos.variantPickerEmpty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {options.map((option) => {
            const isSelected = selected?.variant.id === option.variant.id
            return (
              <ItemListItem
                key={option.variant.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected && itemListRowActiveClassName,
                )}
                aria-label={t('pos.variantPickerSelectAria', { name: option.variant.name })}
                aria-pressed={isSelected}
                onClick={() => setSelected(option)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelected(option)
                  }
                }}
              >
                <ItemListContent>
                  <p className="text-sm font-medium">{option.variant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('pos.variantPickerSku', { sku: option.variant.sku })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('pos.variantPickerStock', {
                      quantity: option.stock.quantity,
                      price: formatLkr(option.stock.sellPrice),
                    })}
                  </p>
                </ItemListContent>
                {isSelected ? (
                  <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden />
                ) : null}
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </CustomDialog>
  )
}
