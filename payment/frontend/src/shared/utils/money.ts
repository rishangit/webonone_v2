export function formatLkr(amountMinor: number): string {
  const major = amountMinor / 100
  return `Rs ${major.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatPeriod(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} – ${formatDate(endIso)}`
}
