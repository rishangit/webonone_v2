import { useTranslation } from 'react-i18next'
import { FormField, Input } from '@webonone/ui-kit'
import { formatLkr } from '@/features/sales/utils/formatMoney'

type PosCashPaymentFieldsProps = {
  total: number
  cashReceived: string
  onCashReceivedChange: (value: string) => void
  inputId: string
}

export function formatPosCashDefault(total: number): string {
  return total > 0 ? total.toFixed(2) : ''
}

export function validatePosCashReceived(cashReceived: string, total: number): boolean {
  const received = Number(cashReceived)
  return Number.isFinite(received) && received >= total
}

export function PosCashPaymentFields({
  total,
  cashReceived,
  onCashReceivedChange,
  inputId,
}: PosCashPaymentFieldsProps) {
  const { t } = useTranslation('sales')
  const received = Number(cashReceived)
  const balance = Number.isFinite(received) ? received - total : null
  const insufficient = balance != null && balance < 0

  return (
    <>
      <FormField label={t('pos.cashReceived')} htmlFor={inputId} required>
        <Input
          id={inputId}
          type="number"
          min={0}
          step="0.01"
          value={cashReceived}
          onChange={(e) => onCashReceivedChange(e.target.value)}
          aria-label={t('pos.cashReceivedAria')}
        />
      </FormField>
      <p
        className={
          insufficient
            ? 'text-sm font-medium text-destructive'
            : 'text-sm font-medium text-foreground'
        }
      >
        {balance != null
          ? t('pos.balance', { amount: formatLkr(balance) })
          : t('pos.balance', { amount: formatLkr(0) })}
      </p>
    </>
  )
}
