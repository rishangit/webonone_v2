export function formatLkr(value: number, currency = 'LKR'): string {
  return `${currency} ${value.toFixed(2)}`
}
