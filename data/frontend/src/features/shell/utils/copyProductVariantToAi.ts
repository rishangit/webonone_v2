import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformAiEntityContext,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { catalogEntityAiRef } from '@/features/shell/utils/catalogEntityAi'

/** Attach the parent product and focus the assistant on one variant (and its stocks). */
export function copyProductVariantToAi(
  searchParams: URLSearchParams,
  options: {
    productId: string
    productName: string
    variantId: string
    variantName: string
  },
): boolean {
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  if (!parentOrigin) {
    return false
  }

  const entity = catalogEntityAiRef('products', options.productId, options.productName)

  sendPlatformAiEntityContext(parentOrigin, entity, {
    openAssistant: true,
    entities: [entity],
    composerText: `Focus on variant "${options.variantName}" (variantId: ${options.variantId}). List existing stocks with list_data_product_variant_stocks, then suggest or create stock batches with create_data_product_variant_stock when asked.`,
  })
  return true
}
