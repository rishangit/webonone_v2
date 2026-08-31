import {
  resolvePlatformEmbedParentOrigin,
  sendPlatformAiEntityContext,
} from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { CatalogEntityKind } from '@/features/catalog/utils/catalogAttributeApi'
import { buildCatalogAttributeAiPaste } from '@/features/shell/utils/catalogEntityAi'

export function copyCatalogAttributeToAi(
  searchParams: URLSearchParams,
  options: {
    kind: CatalogEntityKind
    entityId: string
    entityName: string
    attributeId: string
    attributeName: string
    composerText?: string
  },
): boolean {
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  if (!parentOrigin) {
    return false
  }

  const entities = buildCatalogAttributeAiPaste(
    options.kind,
    options.entityId,
    options.entityName,
    options.attributeId,
    options.attributeName,
  )

  sendPlatformAiEntityContext(parentOrigin, entities[0], {
    openAssistant: true,
    entities,
    ...(options.composerText ? { composerText: options.composerText } : {}),
  })
  return true
}
