import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  Input,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { PosCartLine } from '@/features/sales/types/sales.types'
import { formatLkr } from '@/features/sales/utils/formatMoney'

type PosCartListProps = {
  lines: PosCartLine[]
  onQuantityChange: (key: string, quantity: number) => void
  onUnitPriceChange: (key: string, unitPrice: number) => void
  onRemove: (key: string) => void
}

export function PosCartList({
  lines,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
}: PosCartListProps) {
  const { t } = useTranslation('sales')
  if (lines.length === 0) {
    return <ItemListEmpty>{t('pos.cartEmpty')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {lines.map((line) => (
        <ItemListItem key={line.key}>
          <ItemListContent>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{line.name}</p>
                <p className="text-xs text-muted-foreground">{t(`kinds.${line.itemKind}`)}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  {t('pos.qty')}
                  <Input
                    className="w-20"
                    type="number"
                    min={0.001}
                    step="1"
                    value={String(line.quantity)}
                    onChange={(e) => onQuantityChange(line.key, Number(e.target.value))}
                    aria-label={t('pos.quantityAria', { name: line.name })}
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  {t('pos.unitLkr')}
                  <Input
                    className="w-28"
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(line.unitPrice)}
                    onChange={(e) => onUnitPriceChange(line.key, Number(e.target.value))}
                    aria-label={t('pos.unitPriceAria', { name: line.name })}
                  />
                </label>
                <p className="pb-2 text-sm font-medium">{formatLkr(line.quantity * line.unitPrice)}</p>
              </div>
            </div>
          </ItemListContent>
          <ItemListMenu ariaLabel={t('pos.lineActionsAria', { name: line.name })}>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRemove(line.key)}
            >
              {t('pos.remove')}
            </DropdownMenuItem>
          </ItemListMenu>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
