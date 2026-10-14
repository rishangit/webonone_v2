import type {
  PublicProductVariantOffer,
  PublicProductVariantOfferLine,
} from '@/features/catalog/types/catalog.types'

export function getActivePublicProductLine(
  offer: PublicProductVariantOffer | null | undefined,
  selectedVariantId?: string,
): PublicProductVariantOfferLine | null {
  if (!offer || offer.lines.length === 0) return null
  const defaultLine = offer.lines.find((line) => line.isDefault) ?? offer.lines[0]
  if (!defaultLine) return null
  return offer.lines.find((line) => line.variantId === selectedVariantId) ?? defaultLine
}

/** Sell price only when the variant has stock (matches Data / app product detail). */
export function resolvePublicProductUnitPrice(
  line: PublicProductVariantOfferLine | null,
  listPrice?: number | null,
): number | null {
  if (!line || line.totalQuantity <= 0) return null
  if (line.sellPrice != null) return line.sellPrice
  if (listPrice != null) return listPrice
  return null
}

export function formatPublicAttributeValueLabel(
  value: { valueText: string | null; valueNumber: number | null },
  unitSymbol?: string | null,
): string {
  const base =
    value.valueText != null && value.valueText !== ''
      ? value.valueText
      : value.valueNumber != null
        ? String(value.valueNumber)
        : '—'
  return unitSymbol ? `${base} ${unitSymbol}` : base
}
