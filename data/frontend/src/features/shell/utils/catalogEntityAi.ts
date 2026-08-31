import type { DataAiEntityKind, PlatformAiEntityRef } from '@webonone/platform-embed'
import type { CatalogEntityKind } from '@/features/catalog/utils/catalogAttributeApi'

const CATALOG_AI_KIND: Record<CatalogEntityKind, DataAiEntityKind> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

export function catalogEntityAiRef(
  kind: CatalogEntityKind,
  entityId: string,
  entityName: string,
): PlatformAiEntityRef {
  return {
    service: 'data',
    kind: CATALOG_AI_KIND[kind],
    id: entityId,
    label: entityName,
  }
}

export function attributeAiRef(attributeId: string, attributeName: string): PlatformAiEntityRef {
  return {
    service: 'data',
    kind: 'attribute',
    id: attributeId,
    label: attributeName,
  }
}

export function buildCatalogAttributeAiPaste(
  kind: CatalogEntityKind,
  entityId: string,
  entityName: string,
  attributeId: string,
  attributeName: string,
): PlatformAiEntityRef[] {
  return [
    catalogEntityAiRef(kind, entityId, entityName),
    attributeAiRef(attributeId, attributeName),
  ]
}
