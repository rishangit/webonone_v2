import type { CatalogKind } from '@/features/data/utils/dataPaths'

const CATALOG_WRITE_TOOL_RE =
  /^(create|update|delete)_catalog_item$|^link_catalog_item$|^from_library_catalog$|^fork_catalog_item$/

const GALLERY_KINDS = new Set<string>(['products', 'services', 'spaces'])

export function isCompanyCatalogWriteTool(toolName: string): boolean {
  return CATALOG_WRITE_TOOL_RE.test(toolName)
}

export function isDataAttributeValueWriteTool(toolName: string): boolean {
  return /^create_data_(product|service|space)_attribute_value$/.test(toolName)
}

export function isDataProductVariantWriteTool(toolName: string): boolean {
  return /^create_data_product_variant$|^update_data_product_variant$|^delete_data_product_variant$/.test(
    toolName,
  )
}

export function catalogKindFromToolArgs(
  args: Record<string, unknown> | undefined,
  fallbackKind: CatalogKind | null,
): CatalogKind | null {
  const raw = args?.kind
  if (typeof raw === 'string' && GALLERY_KINDS.has(raw)) {
    return raw as CatalogKind
  }
  if (fallbackKind && GALLERY_KINDS.has(fallbackKind)) {
    return fallbackKind
  }
  return null
}

export function catalogIdFromToolArgs(args: Record<string, unknown> | undefined): string | null {
  const id = args?.id
  return typeof id === 'string' && id.length >= 8 ? id : null
}

export function libraryEntityIdFromToolArgs(args: Record<string, unknown> | undefined): string | null {
  const libraryId = args?.library_entity_id ?? args?.libraryEntityId ?? args?.product_id ?? args?.productId
  if (typeof libraryId === 'string' && libraryId.length >= 8) {
    return libraryId
  }
  return null
}
