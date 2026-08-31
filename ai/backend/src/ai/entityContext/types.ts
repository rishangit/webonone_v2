export const DATA_ENTITY_KINDS = [
  'product',
  'service',
  'space',
  'tag',
  'unit',
  'attribute',
] as const

export type DataEntityKind = (typeof DATA_ENTITY_KINDS)[number]

export const CATALOG_ENTITY_KINDS = ['product', 'service', 'space'] as const

export type CatalogEntityKind = (typeof CATALOG_ENTITY_KINDS)[number]

export type DataEntityContextRef = {
  service: 'data'
  kind: DataEntityKind
  id: string
  label?: string
}

export type WebononeCatalogEntityContextRef = {
  service: 'webonone'
  kind: CatalogEntityKind
  id: string
  label?: string
}

export type EntityContextRef = DataEntityContextRef | WebononeCatalogEntityContextRef

export type ResolvedEntityContext = {
  ref: EntityContextRef
  record?: Record<string, unknown>
  error?: string
}
