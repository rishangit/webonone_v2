import type {
  CatalogAttributeValue,
  CatalogAttributeValueEntry,
  CatalogItem,
} from '@/shared/types/data.types'
import { dataApi } from '@/shared/services/dataApi'

export type CatalogEntityKind = 'products' | 'services' | 'spaces'

export function isCatalogEntityKind(value: string | undefined): value is CatalogEntityKind {
  return value === 'products' || value === 'services' || value === 'spaces'
}

export async function getCatalogEntity(
  kind: CatalogEntityKind,
  entityId: string,
): Promise<CatalogItem> {
  if (kind === 'products') return dataApi.getProduct(entityId)
  if (kind === 'services') return dataApi.getService(entityId)
  return dataApi.getSpace(entityId)
}

export function formatCatalogAttributeEntry(
  attr: CatalogAttributeValue,
  entry: CatalogAttributeValueEntry,
): string {
  if (attr.valueType === 'number' && entry.valueNumber != null) {
    const unit = attr.unit?.symbol ? ` ${attr.unit.symbol}` : ''
    return `${entry.valueNumber}${unit}`
  }
  if (entry.valueText != null && entry.valueText !== '') {
    return entry.valueText
  }
  return '—'
}

export function formatCatalogAttributeValues(attr: CatalogAttributeValue): string {
  if (attr.values.length === 0) return 'No values'
  return attr.values.map((entry) => formatCatalogAttributeEntry(attr, entry)).join(', ')
}

export async function replaceCatalogEntityAttributes(
  kind: CatalogEntityKind,
  entityId: string,
  attributeIds: string[],
): Promise<CatalogItem> {
  if (kind === 'products') return dataApi.replaceProductAttributes(entityId, attributeIds)
  if (kind === 'services') return dataApi.replaceServiceAttributes(entityId, attributeIds)
  return dataApi.replaceSpaceAttributes(entityId, attributeIds)
}

export async function addCatalogEntityAttributeValue(
  kind: CatalogEntityKind,
  entityId: string,
  attributeId: string,
  body: { value_text?: string | null; value_number?: number | null },
): Promise<CatalogItem> {
  if (kind === 'products') {
    return dataApi.addProductAttributeValue(entityId, attributeId, body)
  }
  if (kind === 'services') {
    return dataApi.addServiceAttributeValue(entityId, attributeId, body)
  }
  return dataApi.addSpaceAttributeValue(entityId, attributeId, body)
}

export async function updateCatalogEntityAttributeValue(
  kind: CatalogEntityKind,
  entityId: string,
  valueId: string,
  body: { value_text?: string | null; value_number?: number | null },
): Promise<CatalogItem> {
  if (kind === 'products') {
    return dataApi.updateProductAttributeValue(entityId, valueId, body)
  }
  if (kind === 'services') {
    return dataApi.updateServiceAttributeValue(entityId, valueId, body)
  }
  return dataApi.updateSpaceAttributeValue(entityId, valueId, body)
}

export async function deleteCatalogEntityAttributeValue(
  kind: CatalogEntityKind,
  entityId: string,
  valueId: string,
): Promise<CatalogItem> {
  if (kind === 'products') return dataApi.deleteProductAttributeValue(entityId, valueId)
  if (kind === 'services') return dataApi.deleteServiceAttributeValue(entityId, valueId)
  return dataApi.deleteSpaceAttributeValue(entityId, valueId)
}

export async function setCatalogEntityAttributeValueDefault(
  kind: CatalogEntityKind,
  entityId: string,
  valueId: string,
): Promise<CatalogItem> {
  if (kind === 'products') return dataApi.setProductAttributeValueDefault(entityId, valueId)
  if (kind === 'services') return dataApi.setServiceAttributeValueDefault(entityId, valueId)
  return dataApi.setSpaceAttributeValueDefault(entityId, valueId)
}
