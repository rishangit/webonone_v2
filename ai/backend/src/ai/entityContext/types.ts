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

export const WEBONONE_ENTITY_KINDS = [
  'product',
  'service',
  'space',
  'staff',
  'event',
  'company',
] as const

export type WebononeEntityKind = (typeof WEBONONE_ENTITY_KINDS)[number]

export const DESIGN_ENTITY_KINDS = ['button', 'text'] as const

export type DesignEntityKind = (typeof DESIGN_ENTITY_KINDS)[number]

export type DataEntityContextRef = {
  service: 'data'
  kind: DataEntityKind
  id: string
  label?: string
}

export type WebononeEntityContextRef = {
  service: 'webonone'
  kind: WebononeEntityKind
  id: string
  label?: string
}

export type DesignEntityContextRef = {
  service: 'design'
  kind: DesignEntityKind
  id: string
  label?: string
}

/** @deprecated Prefer WebononeEntityContextRef — catalog kinds are a subset. */
export type WebononeCatalogEntityContextRef = {
  service: 'webonone'
  kind: CatalogEntityKind
  id: string
  label?: string
}

export type EntityContextRef = DataEntityContextRef | WebononeEntityContextRef | DesignEntityContextRef

export type ResolvedEntityContext = {
  ref: EntityContextRef
  record?: Record<string, unknown>
  error?: string
}
