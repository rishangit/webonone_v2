import { formatMoney } from '@webonone/ui-kit'

export function formatPublicListPrice(value: number): string {
  return formatMoney(value, { amountOnly: true })
}
