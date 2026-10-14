import { PriceDisplay, type PriceDisplayProps } from './PriceDisplay'
import { ReadOnlyField } from './ReadOnlyField'

export type ListPriceFieldProps = Omit<PriceDisplayProps, 'size'> & {
  label: string
  /** Detail pages use large price type — same as product variant pricing card. */
  size?: PriceDisplayProps['size']
  className?: string
}

/**
 * Read-only list price row for entity detail cards (product / service / space).
 */
function ListPriceField({
  label,
  value,
  size = 'lg',
  className,
  ...priceProps
}: ListPriceFieldProps) {
  return (
    <ReadOnlyField
      label={label}
      className={className}
      value={<PriceDisplay value={value} size={size} {...priceProps} />}
    />
  )
}

export { ListPriceField }
