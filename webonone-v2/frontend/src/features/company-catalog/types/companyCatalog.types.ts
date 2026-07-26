import { DATA_ENTITY_KEYS, DATA_ENTITY_LABELS, type DataEntityKey } from '@webonone/platform-nav'

export type CatalogEntityKind = DataEntityKey
export type CatalogBindingMode = 'linked' | 'forked' | 'custom'

export const CATALOG_ENTITY_KINDS = DATA_ENTITY_KEYS
export const CATALOG_ENTITY_LABELS = DATA_ENTITY_LABELS

export type CatalogPayload = Record<string, unknown>

export type CompanyCatalogItem = {
  id: string
  companyId: string
  entityKind: CatalogEntityKind
  bindingMode: CatalogBindingMode
  libraryEntityId: string | null
  payload: CatalogPayload | null
  /** Columnar name for forked/custom (null when linked). */
  name?: string | null
  description?: string | null
  createdAt: string
  updatedAt: string
}

/** Display model after optional Data library hydration. */
export type HydratedCatalogItem = CompanyCatalogItem & {
  displayName: string
  displayDescription: string | null
  libraryUnavailable?: boolean
  hydrated?: CatalogPayload | null
}

export function singularLabel(kind: CatalogEntityKind): string {
  const label = CATALOG_ENTITY_LABELS[kind]
  return label.endsWith('s') ? label.slice(0, -1) : label
}

export function bindingModeLabel(mode: CatalogBindingMode): string {
  switch (mode) {
    case 'linked':
      return 'Linked'
    case 'forked':
      return 'Customized'
    case 'custom':
      return 'Company'
  }
}
