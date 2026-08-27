export const DATA_ENTITY_KINDS = [
  'product',
  'service',
  'space',
  'tag',
  'unit',
  'attribute',
] as const

export type DataEntityKind = (typeof DATA_ENTITY_KINDS)[number]

export type DataEntityContextRef = {
  service: 'data'
  kind: DataEntityKind
  id: string
  label?: string
}

export type ResolvedEntityContext = {
  ref: DataEntityContextRef
  record?: Record<string, unknown>
  error?: string
}
