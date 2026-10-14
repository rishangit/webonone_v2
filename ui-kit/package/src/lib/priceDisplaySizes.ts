export type PriceDisplaySize = 'sm' | 'md' | 'lg'

export const PRICE_DISPLAY_SIZE_CLASSES: Record<PriceDisplaySize, string> = {
  sm: 'text-xs font-medium tabular-nums',
  md: 'text-sm font-semibold tabular-nums',
  lg: 'text-lg font-semibold tabular-nums',
}
