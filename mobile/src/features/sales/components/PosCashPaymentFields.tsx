import { Body, PriceDisplay, TextField } from '@webonone/mobile-ui'
import { View } from 'react-native'

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
      <View className="flex-row items-baseline gap-2">
        <Body className={insufficient ? 'text-sm font-medium text-destructive' : 'text-sm font-medium'}>
          Balance
        </Body>
        <PriceDisplay
          value={balance ?? 0}
          size="sm"
          className={insufficient ? 'text-destructive' : undefined}
        />
      </View>
    </>
  )
}
