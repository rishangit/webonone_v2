import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformAiEntityContext,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { catalogEntityAiRef } from '@/features/shell/utils/catalogEntityAi'

export function copyProductVariantsToAi(
  searchParams: URLSearchParams,
  options: {
    productId: string
    productName: string
    composerText?: string
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
    ...(options.composerText ? { composerText: options.composerText } : {}),
  })
  return true
}
