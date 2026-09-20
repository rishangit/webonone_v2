import { Body, TextField } from '@webonone/mobile-ui'
import { formatLkr } from '@/features/sales/utils/formatMoney'

type PosCashPaymentFieldsProps = {
  total: number
  cashReceived: string
  onCashReceivedChange: (value: string) => void
}

export function validatePosCashReceived(cashReceived: string, total: number): boolean {
  const received = Number(cashReceived)
  return Number.isFinite(received) && received >= total
}

export function PosCashPaymentFields({
  total,
  cashReceived,
  onCashReceivedChange,
}: PosCashPaymentFieldsProps) {
  const received = Number(cashReceived)
  const balance = Number.isFinite(received) ? received - total : null
  const insufficient = balance != null && balance < 0

  return (
    <>
      <TextField
        label="Received"
        required
        value={cashReceived}
        onChangeText={onCashReceivedChange}
        keyboardType="decimal-pad"
        accessibilityLabel="Cash received"
      />
      <Body className={insufficient ? 'text-sm font-medium text-destructive' : 'text-sm font-medium'}>
        Balance {formatLkr(balance ?? 0)}
      </Body>
    </>
  )
}
