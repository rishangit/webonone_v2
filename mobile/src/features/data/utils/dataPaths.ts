import { DATA_NAV_SENTINELS } from '@webonone/platform-nav'
import type { Href } from 'expo-router'

export type SimpleEntityKind = 'tags' | 'units' | 'attributes'
export type CatalogKind = 'products' | 'services' | 'spaces'

export function tagListPath(): Href {
  return DATA_NAV_SENTINELS.tags as Href
}

export function tagDetailPath(tagId: string): Href {
  return `${DATA_NAV_SENTINELS.tags}/${tagId}` as Href
}

export function unitListPath(): Href {
  return DATA_NAV_SENTINELS.units as Href
}

export function unitDetailPath(unitId: string): Href {
  return `${DATA_NAV_SENTINELS.units}/${unitId}` as Href
}

export function attributeListPath(): Href {
  return DATA_NAV_SENTINELS.attributes as Href
}

export function attributeDetailPath(attributeId: string): Href {
  return `${DATA_NAV_SENTINELS.attributes}/${attributeId}` as Href
}

export function catalogListPath(kind: CatalogKind): Href {
  return DATA_NAV_SENTINELS[kind] as Href
}

export function catalogDetailPath(kind: CatalogKind, id: string): Href {
  return `${DATA_NAV_SENTINELS[kind]}/${id}` as Href
}
