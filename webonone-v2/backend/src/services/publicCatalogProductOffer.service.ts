import {
  listLibraryProductVariants,
  type DataLibraryProductVariant,
} from '../clients/dataProductStockClient.js'
import { listCompanyStocksForLibraryVariant } from './companyProductStock.service.js'
import { applicableProductVariantDiscountPercents } from './companyCatalogPriceRules.service.js'
import { applyDiscountPercent, priceClockFromDate } from '../utils/applicableCatalogPrice.js'
import { findApprovedCompanyCatalogById } from '../repositories/publicCatalogSearch.repository.js'

export type PublicProductVariantAttributeValue = {
  attributeId: string
  attributeName: string
  attributeValueId: string
  valueText: string | null
  valueNumber: number | null
  valueType: 'number' | 'text'
  unitSymbol: string | null
}

export type PublicProductVariantOfferLine = {
  variantId: string
  name: string
  isDefault: boolean
  attributeValues: PublicProductVariantAttributeValue[]
  totalQuantity: number
  sellPrice: number | null
  compareAtSellPrice?: number | null
  discountPercent?: number | null
}

export type PublicProductVariantOffer = {
  listPrice: number | null
  libraryUnavailable: boolean
  variantCount: number
  lines: PublicProductVariantOfferLine[]
}

function pickActiveStock(
  stocks: Array<{ isActive: boolean; quantity: number; sellPrice: number }>,
): { isActive: boolean; quantity: number; sellPrice: number } | null {
  if (stocks.length === 0) return null
  return stocks.find((item) => item.isActive) ?? stocks[0] ?? null
}

function mapAttributeValues(
  values: DataLibraryProductVariant['values'],
): PublicProductVariantAttributeValue[] {
  return values.map((value) => ({
    attributeId: value.attributeId,
    attributeName: value.attributeName,
    attributeValueId: value.attributeValueId,
    valueText: value.valueText,
    valueNumber: value.valueNumber,
    valueType: value.valueType,
    unitSymbol: value.unitSymbol,
  }))
}

export async function getPublicProductVariantOffer(
  catalogProductId: string,
): Promise<PublicProductVariantOffer | null> {
  const row = await findApprovedCompanyCatalogById('products', catalogProductId)
  if (!row) return null

  const libraryProductId = row.library_entity_id?.trim() ?? ''

  // Linked and customized copies keep the library product id. Custom products have none.
  if (!libraryProductId) {
    return {
      listPrice: null,
      libraryUnavailable: false,
      variantCount: 0,
      lines: [],
    }
  }

  try {
    const variants = await listLibraryProductVariants(libraryProductId)
    const discountPercents = await applicableProductVariantDiscountPercents(
      row.company_id,
      [catalogProductId],
      null,
      priceClockFromDate(),
    )
    const lines: PublicProductVariantOfferLine[] = []

    for (const variant of variants) {
      const stocks = await listCompanyStocksForLibraryVariant(row.company_id, variant.id)
      const active = pickActiveStock(stocks)
      const base = active?.sellPrice ?? null
      const percent = discountPercents.get(`${catalogProductId}:${variant.id}`)
      const discounted = base != null && percent != null && percent > 0
      lines.push({
        variantId: variant.id,
        name: variant.name,
        isDefault: variant.isDefault,
        attributeValues: mapAttributeValues(variant.values),
        totalQuantity: stocks.reduce((sum, item) => sum + item.quantity, 0),
        sellPrice: discounted && base != null && percent != null ? applyDiscountPercent(base, percent) : base,
        compareAtSellPrice: discounted ? base : null,
        discountPercent: discounted ? percent : null,
      })
    }

    const listPrice =
      lines.map((line) => line.sellPrice).find((price) => price != null) ?? null
    return {
      listPrice,
      libraryUnavailable: false,
      variantCount: variants.length,
      lines,
    }
  } catch {
    return {
      listPrice: null,
      libraryUnavailable: true,
      variantCount: 0,
      lines: [],
    }
  }
}
